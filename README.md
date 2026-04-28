# SmartATS - Intelligent Human Capital Screening

SmartATS is a high-performance, AI-driven Applicant Tracking System designed for modern enterprises that require rapid and accurate candidate evaluation.

## The Problem

Traditional recruitment processes suffer from:
- **Information Overload**: Hundreds of resumes per role make manual screening impossible.
- **Inconsistent Evaluation**: Human bias and fatigue lead to missed top-tier talent.
- **Slow Communication**: Delay in scheduling interviews results in candidate drop-off.
- **Data Fragmentation**: Candidate data is often scattered across multiple platforms.

## The Solution: SmartATS

SmartATS solves these issues through a centralized Intelligence Hub that:
1. **Automated AI Screening**: Uses Gemini Pro to analyze resumes against Job Descriptions (JD) in real-time, providing match scores and qualitative feedback.
2. **Global cross-referencing**: Filter and track candidates across different roles and departments.
3. **Automated Follow-ups**: Built-in maintenance logic to remind candidates to schedule interviews.
4. **Unified API Receptor**: A single, global endpoint allows any external portal (LinkedIn, Indeed, etc.) to inject candidates directly into the screening pipeline.
5. **Collaborative Review**: Share detailed "Intelligence Reports" with stakeholders via secure email simulations.

## Technical Architecture

- **Backend**: Node.js/Express server with integrated Vite middleware.
- **Frontend**: React 19 with Tailwind CSS and Framer Motion for a "Brutalist-Modern" design aesthetic.
- **AI Core**: Google Gemini 2.0 Flash for structured resume analysis and extraction.
- **Database**: Local JSON persistence with sync-to-disk capabilities for reliable data storage.
- **Security**: Authorized personnel access control and automated quarantine for suspicious/rejected records.

## Design Credits

**Designed by Ashutosh Tiwari**

Built with precision for the future of recruitment.
