# features/profile

/[subject]/profile: the student's name (profiles.display_name), target SAT total (profiles.target_score),
appearance (light, dark or match device, kept in localStorage like the moon button), account details
and a few numbers from what they have done (answered questions, mistakes cleared, full tests, days
practiced in the last 7 days). Students may update only display_name and target_score (migration 0001),
so no database change was needed. Email can't be changed here: it is the login, and the invite-code
password is made from it. Opened from the name at the bottom of the side menu.
