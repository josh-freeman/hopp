# Hopp think-aloud session

Use a phone held in one hand while seated or standing still. The research scenario is a passenger deciding before an approaching stop; participants should not run, cross roads, or board a vehicle during this session. The moderator should avoid explaining the interface before tasks. Use mock data throughout.

Record participant code, date, device model, OS, browser/version, screen/text zoom, dominant hand, and familiarity with Swiss public transport. Ask permission before recording audio or video; written anonymized notes are sufficient. Record assistance separately from unassisted completion.

## Introduction (one minute)

“We are testing this app's screens. Please say what you notice, what you expect to happen, and what feels uncertain. You can stop whenever you like. These are example journey times. I will mostly listen.”

## Tasks (about ten minutes)

1. **No setup.** Open `/hopp/?mock=1#plan` with fresh browser storage. “You are on a tram in Zürich and want to get to Bern. Find your connections.” Observe whether the user searches without hunting for account, pace, or location settings. Record any accidental tap, typing issue, or keyboard overlap.
2. **Notice the offer.** On Results: “What would you normally do next? Is there another possibility here?” Do not say “sprint”. Record what the user thinks the offered departure means and whether they can find normal connections. Ask what happens if they choose Not now.
3. **Understand the budget.** “Explore the extra option, without committing yet.” On Try it: “Tell me how much time you have, what the run needs, and what the margin means. Would walking work?” Record the actual numbers they read and whether they mistake margin for a guarantee. Ask which button continues and which lets them inspect the route.
4. **Read the route before running.** “You don't know this station well. Find out where you would go.” Let them open the route. Ask them to describe the alight stop, route, and target platform. Observe whether text supports the map and whether they understand it should be read before the run.
5. **Commit with one hand.** Return to Results. “Choose the sprint and get to the live screen.” Count taps from Results: Try it → Sprint it → Go live should take three. Count backtracking and optional route inspection separately. Note grip changes, missed targets, scrolling, and the location of the main action.
6. **Three-second glance.** Hide the phone, then show Live for three seconds. Hide it again. “Where should you get off? Which platform? How much time remains?” Record each answer separately and whether the user confuses train departure countdown with running time. Show Live again and ask what they would do if the sprint became uncatchable.
7. **Fallback.** “You decide you cannot run. What will you do?” Observe whether the normal SBB connection is found without leaving the decision context, and whether its stop, departure, and platform are understood.
8. **Changed conditions.** Open `/hopp/?mock=late&poll=1000#live`. “Watch this screen and tell me whether your decision changes.” Record noticing the change to STAY ON, the interpretation of the message, and the next action. Do not tell the participant which decision to make.
9. **No offer and failure.** Open `/hopp/?mock=nohack#plan` and search; repeat with `?mock=offline#plan` and then `?mock=ratelimit#plan`. Ask what each state means and what they would do next. Check that the lack of a sprint offer is not mistaken for a loading failure and that a failed search is not interpreted as “no trains”.
10. **Optional preferences.** Open Settings. “Imagine you are carrying a bag. Change anything that matters.” Ask what the single sprint pace and minimum margin mean, and whether the user can disable offers. Record if the screen implies they must configure it before using the app.

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
| Reach Live in three taps | | | | |
| Recall alight stop in three seconds | | | | |
| Recall platform in three seconds | | | | |
| Recall countdown in three seconds | | | | |
| Locate and explain fallback | | | | |
| Respond to STAY ON | | | | |
| Understand no-offer and error states | | | | |
| Change bag preference | | | | |

Finish with: “What felt hardest? What would you need to trust this enough to use it?” Group findings by observed issue, frequency, and consequence. Any confusion that could make a user alight on a STAY ON verdict deserves a fix and another session. Separate actual observations from moderator interpretations, and keep physical route verification outside this interface study.
