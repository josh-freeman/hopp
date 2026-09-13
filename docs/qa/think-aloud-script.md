# Hopp think-aloud session

Use a phone held in one hand while seated or standing still. The research scenario is a passenger deciding before an approaching stop; participants should not run, cross roads, or board a vehicle during this session. The moderator should avoid explaining the interface before tasks. Use mock data throughout.

Record participant code, date, device model, OS, browser/version, screen/text zoom, dominant hand, and familiarity with Swiss public transport. Ask permission before recording audio or video; written anonymized notes are sufficient. Record assistance separately from unassisted completion.

## Introduction (one minute)

“We are testing this app's screens. Please say what you notice, what you expect to happen, and what feels uncertain. You can stop whenever you like. These are example journey times. I will mostly listen.”

## Tasks (about fifteen minutes including optional Profile)

1. **No setup.** Open `/hopp/?mock=1#plan` with fresh browser storage. “You are on a tram in Zürich and want to get to Bern. Find your connections.” Observe whether the user searches without hunting for account, pace, or location settings. Record any accidental tap, typing issue, or keyboard overlap.
2. **Notice the offer.** On Results: “What would you normally do next? Is there another possibility here?” Do not say “sprint”. Record what the user thinks the offered departure means and whether they can find normal connections. Ask what happens if they choose Not now.
3. **Understand the budget.** On Results: “Tell me how much time you have, what the run needs, and what the margin means. Would walking work?” Record the actual numbers they read and whether they mistake margin for a guarantee. Observe whether the timing and map can be understood together.
4. **Read the route before running.** “You don't know this station well. Find out where you would go.” Let them explore the map and directions already in Results. Ask them to describe the earlier alight stop, the regular station stop, route, and target platform. Record whether **Get off early** makes the difference clear. Observe whether text supports the map, whether they discover the expandable sources, and whether they understand the route should be read before the run.
5. **Continue with one hand.** “Get to the live screen.” Results → Go live should take one action tap. Count scrolling and backtracking separately. Note grip changes, missed targets, and whether the user confuses opening Live with actually starting the sprint.
6. **Three-second glance.** Hide the phone, then show Live for three seconds. Hide it again. “Where should you get off? Which platform? How much time remains?” Record each answer separately and whether the user confuses train departure countdown with running time. Show Live again and ask what they would do if the sprint became uncatchable.
7. **Fallback.** “You decide you cannot run. What will you do?” Observe whether the normal SBB connection is found without leaving the decision context, and whether its stop, departure, and platform are understood.
8. **Changed conditions.** Open `/hopp/?mock=late&poll=1000#live`. “Watch this screen and tell me whether your decision changes.” Record noticing the change to STAY ON, the interpretation of the message, and the next action. Do not tell the participant which decision to make.
9. **No offer and failure.** Open `/hopp/?mock=nohack#plan` and search; repeat with `?mock=offline#plan` and then `?mock=ratelimit#plan`. Ask what each state means and what they would do next. Check that the lack of a sprint offer is not mistaken for a loading failure and that a failed search is not interpreted as “no trains”.
10. **Optional preferences.** Open Settings. “Imagine you are carrying a bag. Change anything that matters.” Ask what the single sprint pace and minimum margin mean, and whether the user can disable offers. Record if the screen implies they must configure it before using the app.

11. **Optional profile.** Open `/hopp/?mock=1#account`. “Find out what an account adds. Would you need one to check a connection?” Use **Open demo profile** only; do not use a participant’s Google account. Observe whether private storage and optionality are understood.
12. **Practice and a real cosmetic.** “Try a practice question, then change the profile card if anything becomes available.” Record whether the participant notices the 25-point first-correct award, feedback, unlock notice and direct **Use Forest** action. Ask what would happen if they submitted the same answer again.
13. **Daily use and evidence.** While signed into the demo, return to Plan and check a connection. In Profile: “What earned these points? What happens if you check again today, or do not use Hopp tomorrow?” Ask whether the 5 points prove they rode a train and whether 7/30/100-day milestones must be consecutive. Confirm their interpretation of an unverified, zero-point platform note without coaching first.
14. **Account boundaries.** “What would you expect Sign out and Delete Hopp data to do to your website account?” Record whether the distinction is understood. This mock task does not test real Google consent, shared production identity or server deletion.

## Neutral prompts

- “What are you looking for?”
- “What do you expect that to do?”
- “What does that number mean to you?”
- “What would you do next?”
- “What made you choose that?”

Avoid coaching such as “the button is at the bottom” or “that is the safe fallback”. If someone gets stuck, record the issue before helping them continue.

## Record outcomes

| Task | Completed without help? | Time / taps | Mistake or uncertainty | Participant's words |
| --- | --- | --- | --- | --- |
| Search without setup | | | | |
| Identify catchable departure | | | | |
| Interpret have / need / margin | | | | |
| Understand route before run | | | | |
| Reach Live in one tap from Results | | | | |
| Recall alight stop in three seconds | | | | |
| Recall platform in three seconds | | | | |
| Recall countdown in three seconds | | | | |
| Locate and explain fallback | | | | |
| Respond to STAY ON | | | | |
| Understand no-offer and error states | | | | |
| Change bag preference | | | | |
| Understand optional account and demo isolation | | | | |
| Complete practice and apply an unlocked style | | | | |
| Distinguish daily-use points from verified travel | | | | |
| Understand cumulative milestones without a streak | | | | |
| Understand Hopp-only sign-out and deletion | | | | |

Finish with: “What felt hardest? What would you need to trust this enough to use it?” Group findings by observed issue, frequency, and consequence. Any confusion that could make a user alight on a STAY ON verdict deserves a fix and another session. Separate actual observations from moderator interpretations, and keep physical route verification outside this interface study.
