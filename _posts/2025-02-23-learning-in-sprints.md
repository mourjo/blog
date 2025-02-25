---
layout: post
title: Learning In Sprints
date: 2025-02-23 03:49:55 +0530
math: false
code: false
mermaid: false
category: musings
---
The last lecture finished by three in the afternoon. Yet on most days, I did not leave the St Xavier's college campus until five -- I recall spending two hours at the central library reading [William Stallings' Operating Systems](https://www.amazon.in/Operating-Systems-Internals-Design-Principles/dp/9352866711)  or [Jim Kurose's Computer Networking](https://www.amazon.in/Computer-Networking-Eight-Editon-Pearson/dp/9356061319) -- sometimes even choosing the library over my future wife. 

Contrary to that, I never enjoyed classroom studies while I was in school. I would not want to go to school, and I would often get reprimanded for not paying attention in class.

**From a boy who did not want to go to school to someone who spent hours at the library reading drearily dull texts, what changed?** 

# Intuition Drives Learning Better than Classrooms
A significant difference between school and college education was my understanding of the value proposition of a subject. I never fully grasped the the whole point of learning topics that were solely taught for passing an exam, with little connection to the world I saw outside the school grounds. 

I understand now that I learn best in an intuition-driven methodology -- when focal point of a lesson is its applicability. In this [Nature article](https://www.nature.com/articles/s41586-024-08502-w), the authors highlight the gap between academic and applied mathematics:

> Many children from low-income backgrounds worldwide fail to master school mathematics; however, some children extensively use mental arithmetic outside school. 
> 
> Nearly all these children used complex arithmetic calculations effectively at work. They were also proficient in solving hypothetical market maths problems and verbal maths problems that were anchored to concrete contexts. 
> 
> However, they were unable to solve arithmetic problems of equal or lesser complexity when presented in the abstract format typically used in school.

# Looking Back at the Classroom
While I did miss intuition in my school education, the classroom did leave an indelible mark on me about the structure of learning. The classroom taught me two things about learning effectively:
- **Time**: Our semesters and our day-to-day in school were time-bound. The fact that we knew we had only a finite amount of time to learn Mughal Indian history was habitually the only reason I sat down to study.
- **Direction**: We had a predefined syllabus every semester. This syllabus brought about the direction of the entire six months. It focused our attention to one single area instead of the various unrelated topics in the subject.

# Learning in Sprints
In school, I spent more hours studying, yet in college I learnt better. This dichotomy is quite puzzling. Combining both works really well for me, especially now with a 8-hour day-job that leaves little time left for learning. 

Since 2023, I have been following a method for learning new things - I define **learning in sprints** by:
- **Time-boundedness**: As a rule, I put a time-cap on what I learn -- either imposed externally (like a call for papers) or a internally by myself (like [this side project](https://liliput.mourjo.me/)). 
- **Immediately applied**: My goal is not to learn, but to apply what I learn to something. I have a problem or question that I am trying to answer with what I am studying. 
- **Proof of work**: At the end of the allotted time, I produce an artefact of learning -- either by penning down the problem I solved or the things I learnt in the form of blog posts or talks. This is a critical step because it acts not only as proof of work but also helps internalise the concepts I learnt (similar to the [Feynman Technique](https://www.colorado.edu/artssciences-advising/resource-library/life-skills/the-feynman-technique-in-academic-coaching)). 


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

I presented a 2-hour workshop on Separation of Concerns, and here is a screenshot from the presentation. It shows about how with composing simple parts with their own concerns, we can build complex products that add value to the users.

![Image Description](/blog/images/2025-02-23-learning-in-sprints-3.jpg)


## Project 2: Modernization of Tech Stacks 
For the most part of 2024, I worked with a project to rearchitect some old components using the latest technologies. The deepest learnings about this project presented itself to me when I had to articulate why we even invest in improving system architecture:
- **Innovator's Dilemma** from [Building Evolutionary Architectures](https://learning.oreilly.com/library/view/building-evolutionary-architectures/9781491986356/) by Neal Ford, Patrick Kua, and Rebecca Parsons
- **Inherent vs Accidental complexity** from [No Silver Bullet—Essence and Accident in Software Engineering](https://www.cs.unc.edu/techreports/86-020.pdf) by  Fred Brooks
- **Rule of Modularity** from [The Unix Philosophy](https://cscie2x.dce.harvard.edu/hw/ch01s06.html)
- **Writing good programs by controlling complexity** (which "is the essence of computer programming") from [Software Tools](https://www.amazon.in/Software-Tools-Brian-W-Kernighan/dp/020103669X) by  Kernighan and Plauger
- **The [project paradox](https://beyond-agility.com/project-paradox/)** that states that we make the biggest decisions at the beginning of a project when we have the least knowledge

Here is a slide from a talk I did about the modernization plans - it talks about the project paradox -- many more choices are available at the beginning of a project than at the end -- although at the beginning of a project we have many unanswered questions.

![Image Description](/blog/images/2025-02-23-learning-in-sprints-1.png)




## Project 3: Flow Metrics Applied to Microservices
In March, I will be presenting a talk at [Monster Scale 2025](https://www.scylladb.com/monster-scale-summit/). I chose the topic of what flow metrics teaches us about building resilient systems. Preparing to share the stage with speakers like Martin Kleppman and Gwen Shapira, I needed to really brush up on many topics:
- How [Google's **Prequal load balancer** works](https://arxiv.org/pdf/2312.10172) - used in Youtube that uses flow metrics to balance load
- [Van Jacobson's iconic paper](https://dl.acm.org/doi/pdf/10.1145/52324.52356) titled **Congestion Avoidance and Control in TCP**
- Some chapters from **["Project to Product"](https://www.bol.com/nl/nl/f/project-to-product/9200000091413910/)** about the flow framework
- I read the whole book on **[Flow metrics for scrum teams](https://cdn.prod.website-files.com/65a32de388420b743ed9dfa9/668bf79930c6eee883062ab2_flowmetricsforscrumteams.pdf)**
- Chapters on **applying of queueing theory to servers** in [Building Intuition - Insights from Basic Operations Management Models and Principles](https://link.springer.com/book/10.1007/978-0-387-73699-0)
- [Running Prometheus and Grafana](https://github.com/mourjo/monster-scale-2025?tab=readme-ov-file#monitoring-infrastructure) in a Docker container

Below is a real demo from a [Github project](https://github.com/mourjo/monster-scale-2025/tree/main) I built to illustrate the concept of applying flow metrics - on the top is a server that allows congestion to build up, and at the bottom is a server that uses flow metrics to detect and mitigate congestion.

![Image Description](/blog/images/2025-02-23-learning-in-sprints-4.jpeg)


## Project 4: Project Liliput
In April of 2024, I took a two-day course on AWS technologies. I learnt about many things but I learnt few things well enough to build something with them. So when the course concluded, I decided to build [a URL shortener](https://liliput.mourjo.me) based purely on AWS. In doing so, I learnt many topics which were not specifically about AWS:
- **[Authentication with PKCE](https://docs.aws.amazon.com/cognito/latest/developerguide/using-pkce-in-authorization-code.html)**
- [Hardened cookies](https://www.freecodecamp.org/news/web-security-hardening-http-cookies-be8d8d8016e1/)
- [**Atomic counters** in DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/WorkingWithItems.html#WorkingWithItems.AtomicCounters)
- [Firecracker VMs](https://aws.amazon.com/blogs/opensource/firecracker-open-source-secure-fast-microvm-serverless/) that enable fast starts in Lambda functions

Shown underneath is the flow of how [authentication works in Liliput](https://github.com/mourjo/liliput) using AWS Cognito, OAuth and PKCE. Check out Liliput here:  [liliput.mourjo.me](https://liliput.mourjo.me).

![Image Description](/blog/images/2025-02-23-learning-in-sprints-2.png)

## Project 5: REPL Driven Development
For the first five years of my professional life, I worked with a Lisp called [Clojure](https://clojure.org/). Among the many great things about the language, what I miss most in my day-to-day is an interactive [REPL](https://clojure.org/guides/repl/introduction). Nowadays, I work mostly with Spring Boot and Java. I presented this topic in 2024 at an internal conference at my company -- bringing the interactivity of the REPL into the Java world. Yet again, I learnt many eye-opening topics:
- Importance of **exploratory feedback loops** from printing a variable, TDD to debuggers from [REPLs all the way](https://gotopia.tech/sessions/2665/repls-all-the-way-up-a-rubric-for-better-feedback-loops) up by Avdi Grimm
- **Java's REPL** called [JShell](https://docs.oracle.com/en/java/javase/22/jshell/introduction-jshell.html) - which also works for Spring applications
- Identifying that the **needs for developer interactivity are not the same as the users' interactivity needs**

The diagram below highlights the need for developer-centric tools for interacting with the application, and that user interactions do not have the same needs as developer interactions.
![Image Description](/blog/images/2025-02-23-learning-in-sprints-5.jpeg)

# Summing up
Time and direction form the structure of learning - any new topic requires a direction and allocated time. But what I missed in the classroom was the applicability of the things I learnt. As a software engineer, I am privileged to see the applicability of many topics right before my eyes. I found great results in combining the classroom method of time-bounded learning with the direction of applicability. 