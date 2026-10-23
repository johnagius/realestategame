# P8.7 Human playtest — question sheet

Automated checks cannot certify engagement. This sheet is the instrument for the
owner-mandated human playtest (docs/TASKS.md Phase 8, P8.7). Play two sessions,
then answer in free text. There are no right answers; "I was bored" is data.

## Session A — the opening (fresh save, ~15 minutes)

Start a new dynasty (any family). Play from 1850 for about 10–15 years.

1. Did you understand what you were trying to achieve in the first five years?
   Where did you look to find that out?
2. Was there a moment where you had a real choice with at least two defensible
   options? Which moment? What made it hard (or easy)?
3. Did any choice feel obvious — as in, no thinking required, just clicking the
   clearly-best button? Which one?
4. Did anything punish you in a way that felt unfair — where you could not have
   known better from what the game showed you?
5. Did you look at the city view? Did it help you decide anything, or was it
   decoration?
6. When the year report arrived, could you explain why your money went up or down?

## Session B — a developed save (provided save, ~15 minutes)

Load the provided developed save: Dynasty tab → Settings → save slots → Import →
`tools/playtest-save.json` (Chen, 1872, 14 properties, 5 cities; one Mayfair
terrace is already on short let). This is the visitor-economy slice: some London
districts have visitor draw, and eligible properties can switch between long let
and short let.

1. Open a property in a visitor district (the sheet shows the letting strategy
   block). Did location — the district, the landmark, the visitor estimate —
   affect what you decided to do with it?
2. Was more than one choice attractive (keep long let vs switch to short let)?
   What information did you use? Was any of it missing?
3. Switch a property's letting strategy, end the year, and read the report.
   Could you explain the result? Did the estimate match what happened closely
   enough to feel honest?
4. Did the switch create a follow-on decision (the 3-year lock, saturation, a
   second property to convert)? Did you care about this particular building —
   would you recognise it again?
5. Did you want to play another year when the session ended? Why / why not?

## For fresh players (if available)

Watch them play Session A without help. Note only: where they hesitate, what
they click first, what they ignore, and the first thing they ask aloud.

## Scoring the session

- 3+ "yes, the choice was real" answers and zero "unfair without warning"
  answers → the slice is doing its job.
- Any "I could not explain the result" → the report or the estimate is lying;
  treat as a bug, not feedback.

Results are recorded in docs/audit/06-p8-evidence.md (P8.8).
