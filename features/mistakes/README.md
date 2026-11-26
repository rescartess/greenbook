# features/mistakes

Every question the student got wrong (in full tests or practice). /[subject]/mistakes lists the practices they come from (a topic, SQB topic or full test; `get_mistakes` returns setId/setTitle/setKind/collection, migration 0018); /[subject]/mistakes/[practice] lists that practice's questions, grouped by area and question type (`other` = questions outside any set).
Open one to try it again; the database (`retry_mistake`) checks it and clears it after two right answers in a row.
The tab badge counts open mistakes per subject.
