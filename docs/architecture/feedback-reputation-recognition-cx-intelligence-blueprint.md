# J Burguer — Feedback, Reputation, Recognition and Customer Experience Intelligence Blueprint

> **Language policy:** Business language is Spanish and technical language remains English, aligned with the approved architecture corpus.

> **Implementation status:** This is a production-ready architecture blueprint for feedback, reputacion, reconocimientos, and experiencia_cliente capabilities. It does **not** generate code, UI designs, database migrations, or implementation artifacts.

## 0. Mission and scope

Feedback and recognition are first-class business capabilities. This ecosystem must improve customer satisfaction, increase retention and reorder rates, detect operational issues early, measure service quality, recognize high-performing employees, improve brand reputation, and generate actionable analytics across Customer, Kitchen, Delivery, Support, Franchise, Admin, Loyalty, and Analytics platforms.

### 0.1 Non-negotiable principles

| Principle | Requirement |
| --- | --- |
| Verified experience first | Feedback tied to actual pedidos, entregas, productos, sucursales, support cases, promotions, or loyalty interactions receives verified weighting. |
| Recovery before reputation damage | Negative signals must trigger support/operations recovery before public escalation where possible. |
| Recognition with consent | Employee recognition requires privacy-safe data handling and explicit publication consent for public exposure. |
| No retaliation | Employee-facing views must avoid exposing customers in ways that enable retaliation; customer PII is minimized and masked. |
| Moderation by design | Abusive, fraudulent, spam, duplicate, and retaliatory feedback must be detected, queued, reviewed, and auditable. |
| Analytics actionability | Every metric must map to a recommended action, owner, threshold, or escalation route. |
| Fair recognition | Recognition scores must blend customer signals, operational metrics, consistency, and manager review to avoid popularity bias. |

## 1. Domain architecture

| Domain | Purpose | Ownership | Entities | Commands | Queries | Events | Permissions | Dependencies |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `domains/feedback` | Capture, moderate, store, and route feedback for products, pedidos, entregas, sucursales, employees, support, promotions, and loyalty. | Customer Experience + Support + Product. | feedback, review, rating, reaction, complaint, feedback_request, moderation_case, feedback_attachment. | submit_feedback, update_feedback, moderate_feedback, publish_review, hide_review, create_complaint, request_follow_up. | feedback_by_order, reviews_by_product, complaints_by_branch, moderation_queue, customer_feedback_history. | feedback_submitted, review_published, complaint_created, feedback_moderated, feedback_flagged. | `cliente:self`, `support:case`, `ops:incident`, `analytics:view`, `audit:view`. | pedidos, productos, entregas, sucursales, soporte, promociones, recompensas, notificaciones, audit. |
| `domains/reputacion` | Aggregate reputation scores, trends, alerts, and reputation health for brand, branches, products, operations, and employees. | Reputation Management + Analytics + Operations. | reputation_score, reputation_trend, reputation_alert, reputation_threshold, reputation_snapshot. | recalculate_reputation, acknowledge_alert, adjust_threshold, create_reputation_review. | reputation_by_brand, reputation_by_branch, product_reputation, employee_reputation_summary, trend_history. | reputation_score_changed, reputation_alert_triggered, reputation_threshold_crossed. | `analytics:view`, `franchise:view`, `sucursal:manage`, `support:case`. | feedback, analytics, pedidos, incidents, sucursales, empleados. |
| `domains/reconocimientos` | Select, approve, publish, and track employee/team/branch recognition programs. | HR/People + Operations + Franchise. | recognition_nomination, recognition_award, recognition_program, recognition_score, recognition_consent, recognition_publication. | nominate_employee, calculate_recognition_scores, approve_recognition, reject_recognition, publish_recognition, revoke_publication, record_consent. | recognition_candidates, recognition_history, employee_profile_recognition, branch_recognition, program_results. | recognition_nominated, recognition_approved, recognition_published, recognition_revoked, consent_recorded. | `sucursal:manage`, `franchise:manage`, `analytics:view`, `audit:view`; employee self-view where applicable. | feedback, entregas, cocina, soporte, empleados/usuarios, sucursales, audit, notifications. |
| `domains/experiencia_cliente` | Convert feedback, NPS, support, loyalty, and operational signals into CX intelligence and action plans. | Customer Experience + Product Analytics + Operations. | cx_signal, nps_response, cx_segment, recovery_action, retention_campaign_signal, cx_insight. | collect_nps, classify_customer_signal, create_recovery_action, close_recovery_action, launch_retention_signal. | nps_dashboard, customer_satisfaction, retention_impact, sentiment_trends, complaint_analysis, cx_health_by_segment. | nps_submitted, detractor_escalated, recovery_action_created, cx_insight_generated. | `analytics:view`, `support:case`, `promo:manage`, `cliente:self` for own responses. | feedback, reputacion, soporte, recompensas, promociones, pedidos, analytics, notifications. |

## 2. Feedback architecture

| Feedback target | Feedback types | Required data | Optional data | Validation rules | Moderation rules | Visibility rules |
| --- | --- | --- | --- | --- | --- | --- |
| Products | star rating, emoji, detailed review, quick reactions, photo attachment if enabled. | customer/order token, product id, rating/reaction, timestamp. | text, modifiers, image, flavor/quality tags. | Only verified purchasers have verified badge; one primary review per product per order. | Profanity/abuse/spam/image review; suspicious duplicates flagged. | Public only after moderation and consent; branch/admin sees aggregate and moderated details. |
| Orders | satisfaction score, NPS prompt, issue tags, detailed comment. | order id/token, fulfillment type, customer contact or account, status delivered/picked up. | item-level tags, packaging, wait time perception. | Only after completed order; cancellation/refund feedback handled as complaint. | Negative severity auto-routes to support. | Customer owns own feedback; ops/support see scoped details. |
| Delivery | delivery rating, driver courtesy, ETA accuracy, proof/issue tags. | delivery id/order id, branch, delivery operator or delivery team id, rating. | address-zone metadata, route tags, contact experience. | Only completed/failed delivery eligible; no direct public naming without consent policy. | Abuse against employees hidden from employee view and support-reviewed. | Manager sees employee-safe summaries; customer PII masked. |
| Branches | branch rating, cleanliness/service/pickup experience, wait time. | branch id, visit/order context, rating. | photos, service mode, peak/off-peak. | Verified order weighted more than anonymous/public survey. | Review bombing and branch-level anomalies flagged. | Public branch score is aggregate; detailed reviews moderated. |
| Employees | recognition feedback, courtesy, accuracy, service excellence. | employee/team id or inferred assignment, order/support context, rating/tag. | customer compliment, manager note. | Customer cannot target employee unless linked to actual interaction. | Retaliatory or abusive content suppressed and reviewed. | Employee sees positive/constructive sanitized summaries; managers see scoped detail. |
| Support Cases | case satisfaction, resolution quality, agent courtesy, effort score. | case id, customer id/token, case status resolved. | follow-up comment, unresolved reason. | Only after case closed or after inactivity threshold. | Negative case feedback can reopen/escalate. | Support manager sees details; agent sees safe coaching summary. |
| Promotions | promotion satisfaction, value perception, clarity, redemption friction. | promotion/coupon id, order/session context. | comment, eligibility confusion tag. | Only exposed to eligible viewers/responders. | Spam/abuse normal moderation. | Marketing sees aggregate; public review not applicable by default. |
| Loyalty Program | reward satisfaction, redemption ease, perceived value, tier sentiment. | customer id, loyalty action/reward id. | comments, desired rewards. | Authenticated loyalty customer only. | Abuse/spam moderation. | Internal analytics; customer sees own feedback history if exposed. |

## 3. Rating system

| Rating type | Scoring rules | Weighting rules | Fraud prevention | Abuse prevention | Authenticity rules |
| --- | --- | --- | --- | --- | --- |
| Star Ratings | 1-5 normalized to 0-100; require target entity and context. | Verified order > authenticated non-order > anonymous survey; recency weighted. | Rate limits, duplicate detection, verified purchase labels. | Low-star abusive text hidden pending moderation but score retained if authentic. | Verified badge only when tied to completed order/case/delivery. |
| Emoji Ratings | Mapped to sentiment buckets: very negative, negative, neutral, positive, very positive. | Used for quick CX pulse; lower weight than detailed verified review. | Session/order token validation. | Abusive emoji/text combos reviewed. | Must show source/channel and context. |
| NPS | 0-10; 0-6 detractor, 7-8 passive, 9-10 promoter. | Customer-level NPS cadence; branch/product attribution only when survey context supports it. | Frequency cap, customer/order validation, anomaly detection. | Detractor comments moderated but escalation still created. | Survey source and eligibility stored. |
| Quick Reactions | Tag counts such as rico, rapido, amable, frio, tarde, incompleto. | Tags influence diagnostics, not public score alone. | Duplicate tag spam suppression. | Negative/abusive tags routed to moderation. | Linked to order/product/driver/case context. |
| Detailed Reviews | Rating + text, optional images/tags. | Highest qualitative weight after moderation; verified reviews prioritized. | Text similarity detection, account age, order verification. | Profanity, hate, threats, personal data removal. | Public review displays verified status and moderation status. |
| Sentiment Signals | NLP/manual sentiment from text/support notes. | Used as advisory intelligence, never sole punitive employee score. | Model confidence threshold and human review for high-impact actions. | Toxicity detection and redaction. | Sentiment source, model version, confidence stored. |

### 3.1 Fraud and score weighting policy

| Policy area | Rule |
| --- | --- |
| Score decay | Recent feedback has higher operational impact, but long-term reputation includes trailing averages to prevent volatility. |
| Minimum sample size | Public/recognition score display requires minimum eligible sample count or uses “insufficient data.” |
| Outlier handling | Extreme ratings are not discarded automatically; they are flagged for anomaly review if pattern suggests fraud or abuse. |
| Employee scoring | Employee recognition never relies on a single rating; it blends verified feedback, SLA, incident-free work, consistency, and manager review. |
| Complaint weighting | Complaints affect CX alerts immediately but reputation score only after validation/classification. |

## 4. Post-purchase experience

| Experience | Timing | Channels | Eligibility rules | Frequency limits | Recovery paths |
| --- | --- | --- | --- | --- | --- |
| Feedback Requests | After delivered/picked up and order closure buffer. | In-app tracking, email, WhatsApp if consented, notification inbox. | Completed order; not already submitted; not under active critical incident unless recovery-first mode enabled. | Per order once; reminder cap by customer and channel. | If low rating, route to complaint/support recovery. |
| Follow-Up Requests | After complaint resolution, refund, delay, or support closure. | In-app, email, WhatsApp. | Customer had recovery action or case closure. | One follow-up per case/action; cooldown for repeated issues. | Reopen case, supervisor escalation, retention offer review. |
| Review Collection | After positive order signal or promoter NPS. | In-app, email, optional public review CTA. | Verified positive experience; public review requires consent and moderation. | Campaign-level caps to avoid fatigue. | If customer changes to complaint, route to support. |
| Satisfaction Collection | Short pulse after order/support/delivery. | In-app, tracking completion, notification. | Completed interaction. | Frequency cap across touchpoints. | Negative pulse opens detailed feedback. |
| Complaint Collection | Immediately from tracking/detail/support and after low rating. | In-app support entry, feedback center, support case. | Customer has order/case context or verified identity. | No artificial cap for legitimate issues; spam controls apply. | Automatic case creation, escalation, recovery campaign. |

## 5. NPS architecture

| NPS area | Architecture rule |
| --- | --- |
| Collection strategy | Use relationship NPS for overall brand/customer experience and transactional NPS after meaningful interactions; avoid over-surveying. |
| Survey strategy | Ask 0-10 score first, optional reason second, optional issue/category tags third. Keep mobile-first and recoverable. |
| Promoters | Scores 9-10 trigger appreciation, optional review/referral prompt, loyalty campaign eligibility, and positive recognition signals. |
| Passives | Scores 7-8 trigger improvement prompts, segmentation, and retention monitoring but no urgent escalation by default. |
| Detractors | Scores 0-6 trigger complaint classification, support recovery eligibility, branch/product/operations alerting by severity. |
| Escalation rules | Critical detractor with safety, missing item, failed delivery, payment, or repeated complaint creates/links support case and alerts supervisor. |
| Analytics rules | Track NPS by date, branch, fulfillment, cohort, product category, loyalty tier, support interaction, and operational incident correlation. |
| Automation rules | Promoter review/referral, passive retention survey, detractor support escalation, repeated detractor supervisor review. |

## 6. Reputation management

| Reputation scope | Scoring | Trend analysis | Alerts | Thresholds | Escalations |
| --- | --- | --- | --- | --- | --- |
| Brand Reputation | Weighted aggregate of NPS, verified reviews, complaints, support satisfaction, retention impact. | 7/30/90-day rolling trends and campaign/event correlation. | Sudden score drop, complaint spike, public review anomaly. | Minimum sample size; warning and critical thresholds by baseline. | CX owner, Support lead, Operations lead. |
| Branch Reputation | Branch ratings, delivery/pickup SLA, complaints, incidents, local NPS. | Shift/daypart/weekday trend and franchise comparison. | Branch drop, repeated late/cold/missing tags. | Branch-specific baseline + network thresholds. | Supervisor, branch admin, franchise manager. |
| Product Reputation | Product reviews, reorder rate, complaints, refund/missing/cold tags. | Menu/category trend, promo impact, modifier issue correlation. | Product quality drop or review bombing. | Product minimum sample and severity thresholds. | Product owner, kitchen supervisor. |
| Operational Reputation | Kitchen/delivery SLA, delay sentiment, incident rate, ETA accuracy. | Incident and overload correlation. | Delay complaint cluster, failed delivery cluster. | SLA + sentiment combined thresholds. | Operations command path. |
| Employee Reputation | Sanitized customer compliments, verified service signals, incident-free performance, manager recognition. | Monthly/quarterly trends. | Negative pattern requiring coaching, positive pattern for recognition. | Privacy-safe and sample-size guarded. | Manager/HR, not public by default. |

## 7. Recognition system

| Recognition type | Eligibility | Selection criteria | Weighting rules | Approval rules | Publication rules | Visibility rules |
| --- | --- | --- | --- | --- | --- | --- |
| Employee Recognition | Active employee with eligible interactions and consent status. | Compliments, support satisfaction, operational accuracy, consistency, manager nominations. | Verified customer compliments + objective metrics + manager review. | Manager approval; HR review for awards/publication. | Internal by default; public only with consent. | Employee sees own history; managers see scoped team. |
| Delivery Recognition | Delivery operators/teams with completed deliveries. | ETA accuracy, successful deliveries, customer delivery ratings, low incident rate. | High volume adjusted to avoid penalizing hard zones. | Supervisor approval. | Branch/internal; public optional with consent. | Delivery team and managers. |
| Kitchen Recognition | Kitchen operators/stations/teams. | Prep SLA, accuracy, low incident/missing items, compliments mentioning food quality. | Balance speed and quality; overload context normalized. | Kitchen supervisor approval. | Internal or branch spotlight with consent. | Cocina team/managers. |
| Branch Recognition | Branch/team eligibility by period. | NPS, branch reputation, SLA, complaint reduction, sales/reorder impact. | Network-normalized against branch volume and service mode. | Franchise/org approval. | Network-wide publication allowed. | Franchise/admin/branch dashboards. |
| Team Recognition | Cross-functional team or shift. | Incident recovery, high satisfaction, teamwork during overload. | Manager nomination + data validation. | Operations/HR approval. | Internal; public if all identifiable members consent. | Team, branch, organization. |

## 8. Recognition programs

| Program | Selection logic | Scoring logic | Tie-breaking rules | Audit rules |
| --- | --- | --- | --- | --- |
| Employee of the Month | Eligible employees ranked monthly by recognition score and manager nomination. | Customer compliments, NPS/support mentions, operational quality, attendance/eligibility where policy allows. | Higher verified compliments, lower incidents, manager committee decision. | Score inputs, approvers, consent, publication decision logged. |
| Delivery Excellence | Delivery staff ranked by successful deliveries, ETA accuracy, customer ratings, low failed deliveries. | Volume-adjusted and zone-normalized. | Better complaint recovery and fewer reassignment issues. | Assignment data and manager approval logged. |
| Customer Service Excellence | Support/branch service staff with high CSAT and resolution quality. | Case satisfaction, low reopen rate, compliments, SLA. | Higher difficult-case resolution and lower escalations. | Case-safe evidence and approval logged. |
| Kitchen Excellence | Kitchen staff/team with high food quality and SLA. | Prep accuracy, low missing/cold complaints, product compliments, SLA. | Higher consistency during peak/saturation. | Kitchen metrics and supervisor approval logged. |
| Branch Excellence | Branches ranked by balanced scorecard. | NPS, reputation, SLA, complaint reduction, retention/reorder, compliance. | Higher improvement over baseline; fewer critical incidents. | Score snapshots and franchise/org approval logged. |

## 9. Public recognition experience

| Experience | Privacy rules | Consent rules | Publication rules | Removal rules |
| --- | --- | --- | --- | --- |
| Featured Team Member | No private performance details; only approved bio/role/recognition reason. | Explicit employee consent before publication. | Publish through approved content workflow and expiration date. | Employee/HR can request removal; removal logged. |
| Monthly Recognition | Display name/photo only with consent; otherwise anonymized team/branch recognition. | Consent per campaign or standing consent with revocation. | Moderated copy, no customer PII, no sensitive metrics. | Revocation removes public asset within SLA. |
| Team Spotlight | Avoid naming non-consenting members. | Team-level publication consent when identifiable. | Branch/team achievement language reviewed. | Remove or anonymize on consent withdrawal. |
| Branch Achievements | Branch-level metrics can be public if approved and not misleading. | Employee consent not required if no individual identification. | Use verified branch reputation/recognition metrics. | Correct or remove stale/incorrect achievement. |

## 10. Internal recognition experience

| Internal experience | Required capabilities | Privacy guardrails |
| --- | --- | --- |
| Manager Dashboards | Candidate rankings, score breakdown, approval queue, anomalies, consent status, publication status. | Customer PII masked; employee performance scoped to manager hierarchy. |
| Recognition History | Awards, nominations, approvals, publications, revocations, score snapshots. | Immutable audit of approvals; employee self-view available where policy allows. |
| Employee Profiles | Recognition timeline, compliments, coaching-safe trends, consent preferences. | Negative customer details summarized safely; no customer identity exposure. |
| Recognition Metrics | Award distribution, fairness checks, branch/team comparisons, participation. | Monitor bias and sample-size thresholds. |
| Performance Trends | Month-over-month recognition signals and operational correlations. | Used for coaching/recognition, not punitive automation without HR policy. |

## 11. Automation engine

| Automation | Trigger | Conditions | Actions | Escalation paths | Notifications |
| --- | --- | --- | --- | --- | --- |
| Low Rating | Rating below configured threshold. | Verified order/case/delivery; not duplicate/spam. | Create feedback review, classify issue, offer recovery path. | Support case if severe or repeated. | Customer confirmation, support alert. |
| Negative Feedback | Negative sentiment or complaint tags. | Confidence threshold or explicit issue tag. | Create complaint, route to owner, link order/branch/product. | Supervisor if severity/high-value customer/repeat issue. | Support/ops notifications. |
| High NPS | Promoter score. | Frequency cap and consent. | Thank customer, optional review/referral/loyalty prompt. | Marketing/CX campaign eligibility. | Customer appreciation. |
| Excellent Review | 5-star/detailed positive review. | Moderated, verified, no privacy issue. | Publish if consented, recognition signal for employee/team/product. | Manager recognition candidate. | Manager/team digest. |
| Repeated Complaints | Multiple complaints over window. | Same customer/branch/product/delivery issue pattern. | Create CX recovery action, retention risk flag. | CX lead + branch/support supervisor. | Internal alert; customer follow-up. |
| Exceptional Employee Recognition | Recognition score crosses threshold. | Minimum sample and consent status checked. | Nomination created, manager review requested. | HR/Operations approval. | Manager and employee where appropriate. |
| Reputation Drop | Reputation score crosses threshold. | Sample size and anomaly validation. | Create reputation alert and action recommendation. | Operations/franchise escalation. | Dashboard alert + owner notification. |
| Abuse/Fraud Signal | Spam/toxicity/duplicate/anomaly detected. | Rule/model threshold. | Hold visibility, create moderation case. | Security/support moderation if severe. | Moderator queue alert. |

## 12. Support integration

| Integration area | Rule |
| --- | --- |
| Automatic Case Creation | Severe complaints, detractor NPS with issue tags, failed delivery complaint, payment/refund complaint, repeated complaints create or link support cases. |
| Complaint Routing | Route by target: product/kitchen to ops, delivery to delivery supervisor, support case to support manager, loyalty/promo to marketing/support. |
| Escalation Rules | Escalate by severity, repeat count, VIP/loyalty tier, public reputation risk, safety concern, or unresolved SLA. |
| Supervisor Alerts | Branch/delivery/kitchen supervisors receive scoped alerts with masked customer data and recommended action. |
| Resolution Tracking | Cases link to feedback/complaint/recovery action; resolution status feeds follow-up request and CX analytics. |
| Recovery Campaigns | Eligible customers can receive apology, make-good offer, loyalty bonus, or manager callback through approved policy. |

## 13. Loyalty integration

| Loyalty capability | Rule |
| --- | --- |
| Points for Feedback | Award small points for eligible verified feedback, subject to frequency caps and fraud controls; never pay for positive ratings only. |
| Bonus Rewards | Recovery or appreciation rewards require policy eligibility and audit when manual. |
| Review Campaigns | Campaigns can invite reviews after positive verified experiences but must avoid coercion. |
| Retention Campaigns | Detractors/repeated complaints feed retention risk segments and recovery campaigns. |
| Referral Opportunities | Promoters may receive referral prompt/reward if consented and within campaign rules. |

## 14. Analytics architecture

| Dashboard | Metrics | Filters | Actions |
| --- | --- | --- | --- |
| Customer Satisfaction | CSAT, average rating, complaint rate, recovery success, satisfaction by touchpoint. | date, branch, fulfillment, product category, loyalty tier, channel. | Open complaint clusters, launch recovery analysis. |
| NPS | NPS score, promoters/passives/detractors, response rate, detractor reasons. | date, branch, cohort, service mode, campaign, loyalty tier. | Escalate detractor clusters, review promoter opportunities. |
| Product Ratings | product rating, review volume, tags, sentiment, reorder correlation. | product, category, branch, promotion, period. | Product quality investigation. |
| Branch Ratings | branch reputation, CSAT/NPS, complaints, SLA correlation. | branch, franchise, region, period, shift/daypart. | Branch action plan. |
| Delivery Ratings | delivery CSAT, ETA accuracy sentiment, failed delivery complaints, driver/team recognition signals. | branch, zone, operator/team, period. | Delay/reassignment review. |
| Employee Recognition | nominations, awards, score distribution, consent status, fairness checks. | branch, role, program, period. | Approve/review recognition. |
| Complaint Analysis | complaint count/severity/root cause/repeat rate/MTTR. | branch, product, order type, issue tag, support owner. | Open support/ops remediation. |
| Sentiment Trends | sentiment score, topic clusters, emerging issues. | date, branch, product, channel, touchpoint. | Create insight/action. |
| Retention Impact | reorder after feedback, churn risk, recovery effect, loyalty campaign effect. | cohort, feedback type, recovery action, loyalty tier. | Campaign optimization. |

## 15. Data model

### 15.1 Core tables and relationships

| Table | Purpose | Key relationships | Indexes | Retention |
| --- | --- | --- | --- | --- |
| feedback_items | Canonical feedback record. | customer/order/product/branch/delivery/support/promo/reward nullable scoped refs. | target_type+target_id, customer_id, order_id, branch_id, created_at, rating. | Retain per privacy policy; anonymize PII after retention window. |
| feedback_requests | Invitation/reminder tracking. | customer/order/channel/campaign. | customer_id+created_at, order_id, status. | Shorter retention; aggregate after expiry. |
| reviews | Public/internal detailed reviews. | feedback_item, moderation_status, publication. | target_type+target_id+status, created_at. | Public content retained while published; moderation history retained. |
| ratings | Normalized rating values. | feedback_item, rating_type, target. | target_type+target_id+rating_type, created_at. | Aggregate then retain raw by policy. |
| nps_responses | NPS survey responses. | customer/order/branch/campaign. | customer_id+created_at, branch_id+created_at, score. | Retain with anonymization policy. |
| complaints | Complaint cases and classifications. | feedback_item, support_case, order, branch, severity. | severity+status, branch_id+created_at, support_case_id. | Retain per support/legal policy. |
| moderation_cases | Moderation workflow. | feedback/review, moderator, decision. | status+created_at, target_id. | Retain for audit/compliance. |
| reputation_scores | Current score snapshots. | target_type/target_id. | target_type+target_id, score_date. | Historical snapshots retained for analytics. |
| reputation_alerts | Threshold/anomaly alerts. | reputation_score, branch/product/employee. | status+severity, target_type+target_id. | Retain for ops review. |
| recognition_programs | Program definitions. | awards, scoring rules. | active+program_type. | Retain indefinitely or policy. |
| recognition_scores | Periodic candidate scores. | employee/team/branch/program. | program_id+period, candidate_id. | Retain for fairness/audit. |
| recognition_awards | Approved awards. | program, candidate, approver. | candidate_id, program_id+period, published_at. | Retain HR policy. |
| recognition_consents | Publication consent records. | employee/team member, award/publication. | employee_id+status, expires_at. | Retain consent audit. |
| recognition_publications | Public/internal publication records. | award, consent, channel. | status+published_at. | Retain until removal + audit. |
| cx_signals | Unified CX signal stream. | feedback/nps/support/order/loyalty events. | signal_type+created_at, customer_id, branch_id. | Aggregate for long-term analytics. |
| recovery_actions | Customer recovery action lifecycle. | complaint/support/customer/order. | status+owner, customer_id+created_at. | Retain support/CX policy. |

### 15.2 Data standards

| Area | Requirement |
| --- | --- |
| Relationships | Feedback links to one primary target and may include secondary context targets for analytics. |
| Indexes | Every dashboard filter and support/ops queue requires matching composite indexes; RLS predicates must be indexed. |
| Moderation tables | Store moderation status, reason, actor, decision, timestamps, appeal/review if policy supports it. |
| Recognition tables | Store scoring inputs snapshot to make awards reproducible and auditable. |
| Reputation tables | Store daily/periodic snapshots, threshold config, alerts, and acknowledgement status. |
| NPS tables | Store score, classification, survey context, source, eligibility, response metadata. |
| Audit requirements | Audit all moderation decisions, public publication/removal, recognition approval, consent changes, sensitive exports, manual score adjustments. |

## 16. Permissions and privacy

| Actor | Access | Privacy/PII rules | Recognition consent rules |
| --- | --- | --- | --- |
| Customer | Submit/view own feedback, complaints, NPS responses, recovery actions where exposed. | Own data only; public review identity controlled by display preference. | Can compliment employees but cannot force public employee display. |
| Employee | View own recognition history and sanitized compliments if enabled. | No customer PII; negative feedback shown only as coaching-safe aggregate unless policy allows. | Must grant consent for public recognition. |
| Supervisor | View scoped branch/team feedback, complaints, recognition candidates. | Customer PII masked unless support policy permits. | Can request approval/publication but not override consent. |
| Admin | Configure programs, thresholds, moderation policy, dashboards by scope. | Access by organization/franchise scope. | Must respect consent and removal requests. |
| Support | View feedback/complaints linked to cases and create recovery actions. | Purpose-limited, case-bound, PII reveal audited. | No public recognition authority unless assigned role. |
| Reputation/CX Manager | View aggregate and scoped detailed reputation/CX data. | Raw PII minimized; exports gated. | Can review recognition impact only with HR-approved visibility. |
| Security/Admin Audit | View audit/moderation/access events. | Audit access logged; sensitive export requires justification. | Consent/audit records visible by permission. |

## 17. Event architecture

| Event family | Events | Purpose |
| --- | --- | --- |
| Feedback Events | feedback_request_created, feedback_submitted, feedback_updated, feedback_flagged, feedback_moderated. | Capture lifecycle and moderation. |
| Review Events | review_created, review_approved, review_published, review_hidden, review_removed. | Public/internal review lifecycle. |
| Recognition Events | recognition_candidate_scored, recognition_nominated, recognition_approved, recognition_rejected, recognition_published, recognition_revoked. | Recognition program lifecycle. |
| NPS Events | nps_requested, nps_submitted, nps_classified, detractor_escalated, promoter_campaign_eligible. | NPS automation and analytics. |
| Complaint Events | complaint_created, complaint_routed, complaint_escalated, complaint_resolved, recovery_action_created, recovery_action_closed. | Support and CX recovery. |
| Escalation Events | reputation_alert_triggered, supervisor_alert_sent, moderation_escalated, repeated_complaint_detected. | Operational escalation. |
| Analytics Events | cx_signal_generated, sentiment_classified, reputation_score_changed, retention_impact_measured. | Intelligence and dashboards. |

## 18. Abuse and fraud prevention

| Threat | Controls |
| --- | --- |
| Fake Reviews | Verified-order weighting, account age/context, anomaly detection, manual moderation, public verified badge. |
| Review Bombing | Rate limits, burst detection by target/time/source, reputation alert quarantine, sample-size thresholds. |
| Employee Manipulation | Recognition score normalization, manager/HR approval, suspicious nomination detection, no single-source awards. |
| Duplicate Feedback | One primary feedback per target/context, duplicate text similarity, idempotency keys for submissions. |
| Abusive Content | Toxicity/profanity filters, PII redaction, moderation queue, customer warning policy. |
| Spam | Rate limits, CAPTCHA/risk scoring where appropriate, content similarity, blocked sources. |
| Retaliatory Reviews | Detect employee/customer conflict patterns, support-case correlation, moderation review before employee impact. |
| Incentive Abuse | Points capped, no reward for positive-only sentiment, campaign eligibility rules, suspicious pattern review. |
| Public Defamation Risk | Moderation, evidence/context linking, public copy policy, takedown/removal workflow. |

## 19. Screen inventory

| Screen | Platform | Purpose | Primary users | Required permissions | Key components/capabilities |
| --- | --- | --- | --- | --- | --- |
| Feedback Center | Customer/Admin/Support | Submit, view, and route feedback by eligible interaction. | cliente, soporte, admin. | `cliente:self`, `support:case`, scoped admin. | feedback forms, feedback history, complaint entry, moderation status. |
| Review Detail | Customer/Admin/Moderation | View review, moderation, publication, target context. | cliente, moderator, admin. | owner/scoped feedback permissions, `audit:view` for moderation history. | review content, rating, target, moderation actions, publication controls. |
| Recognition Center | Internal/Admin/Franchise | View candidates, nominations, awards, approvals. | supervisors, HR/admin, franchise. | `sucursal:manage`, `franchise:view/manage`. | recognition scores, approval queue, consent status. |
| Recognition History | Employee/Internal/Admin | Show awards, nominations, publication history. | employees, supervisors, HR/admin. | employee self/scoped manager. | timeline, award detail, consent and publication state. |
| NPS Dashboard | Analytics/CX | NPS performance and detractor/promoter analysis. | CX, admin, franchise, support. | `analytics:view`. | NPS metrics, filters, detractor clusters, export. |
| Customer Satisfaction Dashboard | Analytics/CX | CSAT and feedback health across touchpoints. | CX, product, operations. | `analytics:view`. | CSAT, ratings, complaint rate, recovery success. |
| Reputation Dashboard | Analytics/Admin/Franchise | Brand/branch/product/ops/employee reputation. | reputation manager, admin, franchise. | `analytics:view`, `franchise:view` as scoped. | reputation scores, trends, alerts, thresholds. |
| Complaint Dashboard | Support/Ops/CX | Complaint queues, routing, severity, recovery. | support, supervisors, CX. | `support:case`, `ops:incident`, `analytics:view`. | complaint list, escalation, recovery tracking, root causes. |
| Recognition Administration | Admin/HR/Operations | Configure programs, scoring, approvals, publication, consent. | HR/admin, operations. | `sucursal:manage`, `franchise:manage`, `audit:view` for audit. | program editor, score rules, approvals, publication/removal. |

## 20. Governance rules

| Governance area | Rule |
| --- | --- |
| Domain ownership | feedback, reputacion, reconocimientos, and experiencia_cliente require named product/domain owners and analytics/support/operations stakeholders. |
| Moderation governance | Moderation policies are reviewed by Support, Legal/Privacy, Security, CX, and Brand/Reputation owners. |
| Recognition governance | Recognition programs require HR/Operations approval, fairness review, consent workflow, and auditability. |
| Reputation governance | Score formulas and thresholds are versioned, documented, and reviewed before changes. |
| Automation governance | Automated escalations/offers/recognition nominations require owner, trigger definition, frequency cap, and monitoring. |
| Privacy governance | PII and employee recognition data require privacy review, consent records, masking, retention, and removal workflows. |
| Analytics governance | Dashboards must show freshness, sample-size caveats, and avoid exposing raw PII by default. |
| Fraud governance | Fraud/abuse controls are monitored; flagged patterns require moderation/security review where severe. |

## 21. Final deliverable checklist

| Deliverable | Status | Location |
| --- | --- | --- |
| Domain Architecture | Complete | Section 1. |
| Feedback Architecture | Complete | Sections 2-4. |
| Reputation Architecture | Complete | Section 6. |
| Recognition Architecture | Complete | Sections 7-10. |
| NPS Architecture | Complete | Section 5. |
| Automation Rules | Complete | Section 11. |
| Support Integration | Complete | Section 12. |
| Loyalty Integration | Complete | Section 13. |
| Analytics Architecture | Complete | Section 14. |
| Data Model | Complete | Section 15. |
| Event Model | Complete | Section 17. |
| Permissions & Privacy | Complete | Section 16. |
| Fraud Prevention | Complete | Section 18. |
| Screen Inventory | Complete | Section 19. |
| Governance Rules | Complete | Section 20. |

