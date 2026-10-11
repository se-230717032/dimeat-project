# M1: Project Initiation Report

**Project Title:** DIMEAT  
**Team Name:** Dimeat devs  
**Course:** SE3003 - Software Project Management  
**Submission Date:** October 11, 2026  
**Document Version:** M1  
**Repository & Project Board Link:** https://github.com/se-230717032/dimeat-project  

---

## 1. Project Charter

### 1.1 Problem Statement
Many individuals find it difficult to maintain a consistent diet and monitor their daily nutrition over time. Managing different health and dietary metrics—such as calorie intake, BMI, food logs, and physical progress—typically requires switching between multiple separate applications. This fragmented approach makes diet tracking inconvenient, repetitive, and isolated. Furthermore, users lack built-in social support and accessible guidance to keep them motivated, which leads to high abandonment rates and reduced user consistency.

### 1.2 Project Purpose & Value Proposition
DIMEAT is an all-in-one diet and nutrition tracking application designed to make habit management organized, accessible, and engaging. By integrating core nutrition logging (calorie tracker, BMI calculation, progress monitoring) with interactive social features (direct messaging, content sharing) and an AI-powered assistant, DIMEAT provides a unified platform that drives user retention through community interaction and personalized guidance.

### 1.3 Project Scope & MVP Boundaries

#### In-Scope (MVP):
* **User Management:** Secure registration, login, and basic profile management.
* **Core Nutrition Tracking:** Daily calorie tracking, meal logging, and BMI calculation.
* **Progress Monitoring:** Tracking user health progress and dietary trends over time.
* **Social Interaction:** Direct messaging between users and content/meal sharing.
* **AI-Powered Assistant:** AI integration providing basic diet-related guidance and queries.

#### Out-of-Scope (Future Releases / Exclusions):
* Professional medical or dietary diagnosis and healthcare treatment plans.
* Hardware integration with smartwatches or wearable fitness devices.
* Payment processing, subscription management, or commercial monetization systems.
* Full-scale commercial deployment or integration with external clinical healthcare systems.

---

## 2. Stakeholder Map & Communication Matrix

### 2.1 Stakeholder Identification & Analysis

| Stakeholder Name / Group | Stakeholder Category | Interest / Role | Power / Influence | Management Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **End Users (Diet Trackers)** | Primary Users | Tracking daily nutrition, calculated BMI, social sharing, and messaging. | High Interest / Low Power | Maintain continuous feedback loops via UX reviews and usability testing. |
| **Course Instructor & TAs** | Project Sponsors / Evaluators | Evaluating software management practices, milestone deliverables, and code quality. | High Interest / High Power | Keep closely informed via weekly status updates and scheduled milestone reports. |
| **Development Team (Dimeat devs)** | Internal Team | Designing, developing, testing, and documenting the DIMEAT MVP application. | High Interest / High Power | Collaborate via daily standups, Git workflows, and active GitHub Projects tracking. |

### 2.2 Stakeholder Communication Plan

| Stakeholder | Communication Channel | Frequency | Content / Purpose | Responsible Lead |
| :--- | :--- | :--- | :--- | :--- |
| Course Instructor & TAs | LMS / GitHub Releases | Weekly / Milestone-based | Submitting weekly status updates, milestone reports (M0–M5), and demo links. | Cemre Alkış (PM) |
| Development Team | Discord / GitHub Issues | Daily / Continuous | Discussing tasks, technical decisions, pull requests, and risk blockers. | Ebru Sena Ünsal (Tech Lead) |
| Peer Reviewers / Test Group | Feedback Forms | Weeks 9 & 12 | Gathering product usability feedback and defect reports. | Harun Arslan (Test Lead) |

---

## 3. Success Criteria

Project success will be measured across three main performance areas:

### 3.1 Product Criteria
* Successful delivery of a fully functional Minimum Viable Product (MVP) containing authentication, calorie tracker, BMI calculator, messaging, content feed, and AI guidance within 10–12 weeks.
* Zero blocker defects in core user journeys (e.g., meal logging, user authentication, and basic messaging).

### 3.2 Process & Management Criteria
* 100% on-time submission of all required weekly progress reports and milestone documents.
* Full traceability of tasks through a maintained GitHub Projects board across all standard status columns (Backlog, To Do, In Progress, Review/Test, Done).
* Documented, balanced contributions from all team members visible in Git commit histories and pull requests.

### 3.3 Technical & Quality Criteria
* Relational database integrity validated by clean ER diagrams and structured schema migration scripts.
* Core API responses delivered in under 1.5 seconds under standard mock data loads.

---

## 4. Delivery Approach Decision

### 4.1 Selected Approach
**Agile Framework (Scrum / Kanban Hybrid)**

### 4.2 Rationale
1. **High Feature Dynamic:** Integrating social messaging, meal tracking, and an AI assistant introduces uncertainty regarding interface integration and database schema complexity.
2. **Short Iteration Cycles:** A 10–12 week timeframe demands short 2-week sprints to deliver incremental product builds, receive rapid feedback, and adapt early.
3. **Risk Containment:** An Agile approach allows the team to prioritize core calorie tracking and database setup first, ensuring that complex real-time messaging or AI components can be deferred or simplified without compromising the MVP deadline.