---
layout: post
title: "Quick Meetings: Why You Need Property Based Tests"
date: 2025-05-25 09:04:24 +0200
math: false
code: true
mermaid: false
category: musings
---
Today I am open-sourcing my [quick-meetings](https://github.com/mourjo/quick-meetings) repository. It has one aim - to show the importance of property based testing (or generative testing).

At its core, this project allows you to create meetings. It is a very simple application. What could possibly go wrong?

![Image Description](/blog/images/2025-05-25-quick-meetings-why-you-need-property-based-tests-1.png)

## Bug 1: Non-JSON response body
If the accept header is something like `text/html`, Spring will try to return an HTML page, which is not what we want from an API - causing errors like this:
```
com.fasterxml.jackson.core.JsonParseException:
  Unexpected character ('<' (code 60)): expected a valid value (JSON String, Number, Array, Object or token 'null', 'true' or 'false')
  at [Source: (String)"<html><body><h1>Whitelabel Error Page</h1><p>This application has no explicit mapping for /error, so you are seeing this as a fallback.</p><div id='created'>Sat May 24 14:11:11 CEST 2025</div><div>There was an unexpected error (type=Method Not Allowed, status=405).</div></body></html>"; line: 1, column: 1]
```

Check out this [branch](https://github.com/mourjo/quick-meetings/tree/demo-1-server-never-returns-5xx) on how this was detected with property based testing.


## Bug 2: NullPointers and 5xx
Your code should never return a 5xx for any kind of request - a catch-all response code like 5xx should only be reserved for infrastructure issues what you genuinely cannot predict.

But if you send a payload like this, the response will be -- quite sadly -- a 5xx:

```
curl -X 'POST' 'http://localhost:9981/meeting' -s \
  -H 'Content-Type: application/json' \
  -d '{
  "userId": 260754,
  "name": "Bobby'\''s meeting"
}' | jq .

{
  "timestamp": "2025-05-25T07:14:37.890+00:00",
  "status": 500,
  "error": "Internal Server Error",
  "trace": "java.lang.NullPointerException: Cannot invoke \"me.mourjo.quickmeetings.web.dto.MeetingDuration.from()\" because..."
}
```

Check out this [branch](https://github.com/mourjo/quick-meetings/tree/demo-1-server-never-returns-5xx) on how property based tests found and resolved this bug.

## Bug 3: Gap in Daylight Savings
In the following snippet, a meeting creation request specifies the start-time at **02:34** and end-time at **03:04**, the error thrown says the start time is after the end time.

```
Original Sample
---------------
  meetingArgs:
    MeetingArgs[fromDate=2025-03-30, fromTime=02:34:31, toDate=2025-03-30, toTime=03:04:31, timezone=Europe/Amsterdam]

  Original Error
  --------------
  java.lang.AssertionError:
    Expecting actual:
      "{"message":"Meeting cannot start (2025-03-30T03:34:31+02:00[Europe/Amsterdam]) after its end time (2025-03-30T03:04:31+02:00[Europe/Amsterdam])"}"
    to contain at least one of the following elements:
      ["Meeting created"]
    but none were found
```

This happens when the start or end time falls in a local timezone which is a "gap" due to daylight savings. On 30 March 2025, at `02:00:00` clocks in France were turned forward 1 hour to `03:00:00` - the time between 2 and 3 does not exist and is a gap.

This is caught again by property-based tests in [this branch](https://github.com/mourjo/quick-meetings/tree/demo-2-invalid-date-range).

## Bug 4: Query to check overlapping meetings

The following query has a bug (in the last AND clause) - it is quite hard to catch it at first glance (`$1` and `$2` are placeholders for the start and end time of a new meeting being created):

```sql
SELECT *
FROM
meetings existing_meeting JOIN user_meetings um ON existing_meeting.id = um.meeting_id
WHERE um.user_id IN (:userIds)
AND um.role_of_user IN ('OWNER', 'ACCEPTED')
AND (
  (existing_meeting.from_ts <= $1 AND existing_meeting.to_ts >= $1)
  OR
  (existing_meeting.from_ts <= $2 AND existing_meeting.to_ts >= $2)
)
```

Property based tests in [this branch](https://github.com/mourjo/quick-meetings/tree/demo-3-meeting-creation-scenarios) reports the minimal case when this happens. This test fails when the second meeting is overlapping with the first but only if the second meeting **starts before**and **ends after** the first - note how the original sample finds a larger time overlap but the shrunk example finds the smallest failing case:

```
Shrunk Sample (130 steps)
-------------------------
  meeting1Start: 2025-01-01T10:00:01
  meeting1DurationMins: 1
  meeting2Start: 2025-01-01T10:00
  meeting2DurationMins: 2

Original Sample
---------------
  meeting1Start: 2025-01-01T20:09:29
  meeting1DurationMins: 6
  meeting2Start: 2025-01-01T19:55:33
  meeting2DurationMins: 49
```


## Bug 5: Accepting a meeting causes an overlap

In the previous bug, the fix ensured that the query to check overlapping meeting is correct but it is still possible to have overlapping meetings - as caught by property based tests in [this branch](https://github.com/mourjo/quick-meetings/tree/demo-4-meeting-acceptations). 

Complex interleaving of user interactions -- creating meetings, inviting others to meetings and accepting meeting invites -- breaks the invariant that no person can be in two meetings at the same time. But which sequence of actions?

[Property based tests](https://github.com/mourjo/quick-meetings/tree/demo-4-meeting-acceptations) find minimal subset of operations that trigger the failure:
- Alice and Charlie create overlapping meetings - this is okay because our invariant is no person can be at the same meeting, but if the attendees are different (here Alice and Charlie), it is perfectly fine
- It is also not a problem when Charlie is invited to Alice's meeting
- It becomes a problem when Charlie accepts that meeting - because it overlaps with the meeting he created
- This is the minimal set of operations that shows the bug

```
OperationsGenTests.noOperationCausesAnOverlap:63 Invariant failed after the following actions: [
    Inputs{action=CREATE, user=alice, from=2025-06-09T10:21Z, to=2025-06-09T10:22Z}
    Inputs{action=INVITE, user=charlie, meetingIdx=0}
    Inputs{action=CREATE, user=charlie, from=2025-06-09T10:21Z, to=2025-06-09T10:22Z}
    Inputs{action=ACCEPT, user=charlie, meetingIdx=0}
]
```

But there are other more nuanced cases like this which sometimes get reported as well:
- Charlie creates a meeting 0
- Bob is invited to meeting 0
- Alice creates a meeting 1 (overlapping with meeting 0)
- Bob is invited to meeting 1
- Bob accepts the invitation to meeting 0 (still no overlap)
- Bob accepts the invitation to meeting 1 (this causes an overlap for Bob)

```
OperationsGenTests.noOperationCausesAnOverlap:67 Invariant failed after the following actions: [
    Inputs{action=CREATE, user=charlie, from=2025-06-09T10:21Z, to=2025-06-09T10:22Z}
    Inputs{action=INVITE, user=bob, meetingIdx=0}
    Inputs{action=CREATE, user=alice, from=2025-06-09T10:21Z, to=2025-06-09T10:22Z}
    Inputs{action=INVITE, user=bob, meetingIdx=0}
    Inputs{action=ACCEPT, user=bob, meetingIdx=0}
    Inputs{action=ACCEPT, user=bob, meetingIdx=1}
]
```

## Bug 6: Empty meetings 
Once we have a way to test interleaving of operations, it is easy to extend that same framework - for example to preserve the invariant of no meeting should be empty.

While this seems like a gross miss, when we work on individual features, it is difficult to keep track of the larger product's vision or expectations. This branch is the same - once we allow people to reject meeting invites, this bug manifests itself.

The minimal set of operations that fail is simple - this is provided by the test output as well:
- Alice creates a meeting
- Alice rejects that same meeting

```
OperationsGenTests.noOperationCausesEmptyMeetings:70 Invariant failed after the following actions: [
    Inputs{action=CREATE, user=alice, from=2025-06-09T10:21Z, to=2025-06-09T10:22Z}
    Inputs{action=REJECT, user=alice, meetingIdx=0}
]
```

Check [this branch](https://github.com/mourjo/quick-meetings/tree/demo-5-empty-meetings) for the details.

## Conclusion
Testing invariants is different from example based tests. It requires you to think of what the product you are building _should_ do instead of _how_ it should do it. As we saw above, it is very hard to both build a new feature and ensure there are no obscure bugs (like daylight savings) and that it performs as expected in the face of complex interleaving of actions (like accepting meetings which overlap with existing meetings).

Property based testing encourages you to think of your code as a black box of logic - to test its limits with permutations of inputs (both user input and state) - which is simply not possible to enumerate manually.

If you like this topic, I am going to be speaking at TechCamp in Hamburg in June - hope to see you there!

![Image Description](/blog/images/2025-05-25-quick-meetings-why-you-need-property-based-tests-2.jpeg)