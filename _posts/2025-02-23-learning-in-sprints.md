---
layout: post
title: Learning In Sprints
date: 2025-02-23 03:49:55 +0530
math: false
code: false
mermaid: false
category: musings
---
Lectures got over by three in the afternoon. Yet on most days, I did not leave the St Xavier's college campus until five -- I recall spending two hours at the central library reading books like [William Stallings' Operating Systems](https://www.amazon.in/Operating-Systems-Internals-Design-Principles/dp/9352866711),  and [Jim Kurose's Computer Networking](https://www.amazon.in/Computer-Networking-Eight-Editon-Pearson/dp/9356061319) -- sometimes even choosing the library over my future wife. 

Contrary to that, I never enjoyed classroom studies while I was in school. I would not want to go to school, and I would often get reprimanded for not paying attention in class.

**From a boy who did not want to go to school to someone who spent hours at the library reading drearily dull texts, what changed?** 

# Intuition Drives Learning Better than Classrooms
The only difference between school and college education was my understanding of the value proposition of a subject. I never fully grasped the the whole point of learning topics that were solely taught for passing an exam. 

I understand now that I learn best in an intuition-driven methodology. I learn much faster when focal point of a lesson is its applicability. Turns out, it is not just me -- in this [Nature article](https://www.nature.com/articles/s41586-024-08502-w), the authors surveyed school-going children to find that arithmetic skills do not transfer between applied and academic mathematics:

> Nearly all these children used complex arithmetic calculations effectively at work. They were also proficient in solving hypothetical market maths problems and verbal maths problems that were anchored to concrete contexts. However, they were unable to solve arithmetic problems of equal or lesser complexity when presented in the abstract format typically used in school.

# Looking Back at the Classroom
While I did miss intuition in my classroom education, the classroom did leave an indelible mark on me about the way of learning. The classroom taught me two things about learning effectively -- I find both these aspects keys to keep on learning along with my day job:
- **Time**: Our semesters and our day-to-day in school were time-bound. For example, we could only learn about Mughal Indian history for 40 mins in a day for half a year. The fact that we knew we had only a finite amount of time to learn something was habitually the only reason I sat down to study.
- **Direction**: We had a syllabus every semester and that was tested in the exam. This syllabus brought about the direction of the entire six months. Most importantly, it allowed us to focus on one single area instead of the various unrelated topics part of the subject.

# Learning in Sprints
Combining the classroom method of education with the missing intuition and applicability, since 2023, I have been following a method for learning new things - I define **learning in sprints** by:
- **Time-boundedness**: A time-cap on what I learn -- either imposed externally (like a call for papers) or a internally by myself (like [this side project](https://liliput.mourjo.me/)). I usually spend a couple of months on a single topic, which is not too relaxed but not too hurried either. Acknowledging that I only have a limited time orients my learning process to what I want to solve rather than to scour the subject matter's landscape, as I might do in a PhD.
- **Immediately applied to something**: My goal is not to learn, but to apply what I learn to something. I usually have a problem or question that I am trying to answer with what I am reading. This also means, I do not read text books cover-to-cover, I mostly use books and papers as references to find the answer to the original question. When I come across topics I learnt in college, I see it in a completely different light -- as it applies to the problem at hand and with the lens of ten years of work experience. 
- **Proof of work**: As a rule, I produce an artefact of learning -- either by penning down the problem I solved or the things I learnt in the form of blog posts or talks. This is a critical step because it acts not only as proof of work but also because narrating what I learnt internalises the topics on a much deeper level (similar to the [Feynman Technique](https://www.colorado.edu/artssciences-advising/resource-library/life-skills/the-feynman-technique-in-academic-coaching)). Plus, there is the added benefit of summarizing what I learnt for me to come back to later on.


# Things I learnt in Sprints in 2024
The proof is in the pudding. Following are five things I did last year following the learning in sprints way. With some overlap, that is about ten months of learning in one year.

## Project 1: Separation of Concerns
In the fall of 2024, I got the opportunity to explain the topic of "Separation of Concerns" to a group of new graduates. I learnt many things about Object Oriented design while preparing for this workshop. Many of these things were not new to me, but re-learning about them after a decade made all the difference. 
- **Principle of least commitment** from [Structure and Interpretation of Computer Programs](https://web.mit.edu/6.001/6.037/sicp.pdf) by Sussman and Abelson 
- The distinction between **contractual interface vs internal implementation** from [Object Oriented Analysis and Design with Applications](https://www.amazon.in/Object-Oriented-Analysis-Applications-Addison-wesley-Technology/dp/020189551X) by Grady Booch
- **Vertical splitting of three-layer systems** from [Presentation Domain Data Layering](https://martinfowler.com/bliki/PresentationDomainDataLayering.html) by Martin Fowler
- Using **hexagonal architecture** for separating concerns from [this blog post](https://netflixtechblog.com/ready-for-changes-with-hexagonal-architecture-b315ec967749) by Netflix
- **Modularization as a mechanism for improving flexibility and comprehensibility** from [On the criteria to be used in decomposing systems into modules](https://www.win.tue.nl/~wstomv/edu/2ip30/references/criteria_for_modularization.pdf) by DL Parnas
- My own implementation of a [poor example](https://github.com/mourjo/soc-movies) of separation of concerns and a [good example](https://github.com/mourjo/tinfoil) of separation of concerns


![Image Description](/blog/images/2025-02-23-learning-in-sprints-3.jpg)


## Project 2: Modernization of Tech Stacks 
For the most part of 2024, I worked with a project to rearchitect some old components using the latest technologies. My deepest learnings came when I had to do a presentation about the project and I asked myself why we are even doing this.
- **Innovator's Dilemma** from [Building Evolutionary Architectures](https://learning.oreilly.com/library/view/building-evolutionary-architectures/9781491986356/) by Neal Ford, Patrick Kua, and Rebecca Parsons
- **Inherent vs Accidental complexity** from [No Silver Bullet—Essence and Accident in Software Engineering](https://www.cs.unc.edu/techreports/86-020.pdf) by  Fred Brooks
- **Rule of Modularity** from [The Unix Philosophy](https://cscie2x.dce.harvard.edu/hw/ch01s06.html)
- **Writing good programs by controlling complexity** (which "is the essence of computer programming") from [Software Tools](https://www.amazon.in/Software-Tools-Brian-W-Kernighan/dp/020103669X) by  Kernighan and Plauger
- **The [project paradox](https://beyond-agility.com/project-paradox/)** that states that we make the biggest decisions at the beginning of a project when we have the least knowledge

![Image Description](/blog/images/2025-02-23-learning-in-sprints-1.png)




## Project 3: Flow Metrics Applied to Microservices
In March 2025, I will be presenting a talk at [Monster Scale 2025](https://www.scylladb.com/monster-scale-summit/), and I chose the topic of what flow metrics teaches us about building resilient systems. Preparing to share the stage with speakers like Martin Kleppman and Gwen Shapira, I need to learn many things:
- How [Google's **Prequal load balancer** works](https://arxiv.org/pdf/2312.10172) - used in Youtube that uses flow metrics to balance load
- [Van Jacobson's iconic paper](https://dl.acm.org/doi/pdf/10.1145/52324.52356) titled **Congestion Avoidance and Control in TCP**
- Some chapters from **["Project to Product"](https://www.bol.com/nl/nl/f/project-to-product/9200000091413910/)** about the flow framework
- I read the whole book on **[Flow metrics for scrum teams](https://cdn.prod.website-files.com/65a32de388420b743ed9dfa9/668bf79930c6eee883062ab2_flowmetricsforscrumteams.pdf)**
- [Running Prometheus and Grafana](https://github.com/mourjo/monster-scale-2025?tab=readme-ov-file#monitoring-infrastructure) in a Docker container

![Image Description](/blog/images/2025-02-23-learning-in-sprints-4.jpeg)


## Project 4: Project Liliput
In April of 2024, I took a two-day course on AWS technologies. I learnt about many things but I learnt few things well enough to build something with. So when the course concluded, I decided to build [a similar URL shortener](https://liliput.mourjo.me) based purely on AWS. In doing so, I learnt many concepts which were not specifically about AWS:
- **[Authentication with PKCE](https://docs.aws.amazon.com/cognito/latest/developerguide/using-pkce-in-authorization-code.html)**
- [Hardened cookies](https://www.freecodecamp.org/news/web-security-hardening-http-cookies-be8d8d8016e1/)
- [**Atomic counters** in DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/WorkingWithItems.html#WorkingWithItems.AtomicCounters)
- [Firecracker VMs](https://aws.amazon.com/blogs/opensource/firecracker-open-source-secure-fast-microvm-serverless/) that enable fast starts in Lambda functions

![Image Description](/blog/images/2025-02-23-learning-in-sprints-2.png)

## Project 5: REPL Driven Development
For the first five years of my professional life, I worked with a Lisp called [Clojure](https://clojure.org/). Among the many great things about the language, perhaps what I miss in my day-to-day is an interactive [REPL](https://clojure.org/guides/repl/introduction)-driven development methodology. Of late, I work mostly with Spring Boot and Java. I dove into this topic at a talk I presented in 2024 at an internal conference at my company -- bringing the interactivity of the REPL from the Lisp world into the Spring/Java world.
- Importance of **exploratory feedback loops** from printing a variable, TDD to debuggers from [REPLs all the way](https://gotopia.tech/sessions/2665/repls-all-the-way-up-a-rubric-for-better-feedback-loops) up by Avdi Grimm
- **Java's REPL** called [JShell](https://docs.oracle.com/en/java/javase/22/jshell/introduction-jshell.html) - which also works for Spring applications
- Identifying that the **needs for developer interactivity are not the same as the users' interactivity needs**

![Image Description](/blog/images/2025-02-23-learning-in-sprints-5.jpeg)

# Summing up
Time and direction form the structure of learning - any new topic requires a direction and allocated time. But what I missed in the classroom was the applicability of the things I learnt. As a software engineer, I am privileged to see the applicability of many topics right before my eyes. I found great results in combining the classroom method of timeboundedness with the direction of applicability. 

**I learn better when I direct the learning process by the applicability of a topic** - just like the [kids on the street](https://www.nature.com/articles/s41586-024-08502-w) who did better arithmetic than the classroom students. I call that process learning in sprints.