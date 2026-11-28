# features/profile

/[subject]/profile: the student's name (profiles.display_name), target SAT total (profiles.target_score),
appearance (light, dark or match device, kept in localStorage like the moon button), account details
and a few numbers from what they have done (answered questions, mistakes cleared, full tests, days
practiced in the last 7 days). Students may update display_name, target_score, colors, photo, SAT date and bio (column grants,
migrations 0001, 0020, 0021); names are 1–40 characters (0030). Email can't be changed here: it is the login, and the invite-code
password is made from it. Opened from the name at the bottom of the side menu.

Delete my account (0030): the Account card has "Delete my account" (students only). It asks once more, removes the
photo files, calls `delete_my_account()` (the account and every score, answer and mistake go by cascade), signs out
and goes to the home page.
