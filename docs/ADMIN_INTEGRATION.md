# Urban Eye Admin Integration Contract

## New intake source

`blueprint_submissions`

The lead magnet owns the original submission and generated recommendation. Urban Eye Admin should treat it as source evidence, not overwrite it.

## Recommended workflow

```text
Blueprint Submission
→ Internal Review
→ Link or Create Company
→ Link or Create Contact
→ Create Lead
→ Blueprint Review Call
→ Quote Submission
→ Proposal
→ Client / Project
```

## Minimum queue columns

- Created date
- Company
- Contact
- Primary service
- Primary and secondary pillars
- Fit score
- Lead temperature
- Urgency
- Desired timeline
- Source / UTM
- Status
- Owner

## Qualification actions

- Mark reviewed
- Assign owner
- Add internal note
- Send follow-up
- Book review
- Convert to nurture
- Create/link company and contact
- Create lead
- Start quote
- Close as not a fit

## Deduplication

Use normalized email plus normalized company domain as the first matching layer. Do not automatically merge records when the email or domain is ambiguous. Preserve the original submission ID on every downstream entity.

## Data ownership

- The public Blueprint app may create submissions only through its server Route Handler.
- The service-role key remains server-only.
- The public browser receives no database credentials.
- Urban Eye Admin users authenticate through Supabase Auth.
- Role-aware RLS policies should be defined in the Admin project before enabling reads.
- Original answers, scores, and generated result should remain immutable after intake; internal status, owner, notes, and links may change.

## Activity events

- `blueprint.submitted`
- `blueprint.reviewed`
- `blueprint.assigned`
- `blueprint.follow_up_sent`
- `blueprint.review_booked`
- `blueprint.qualified`
- `blueprint.converted_to_lead`
- `blueprint.closed`
