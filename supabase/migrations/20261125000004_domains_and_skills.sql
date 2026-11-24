-- 0004 The official SAT content areas (domains) and skills, in College Board order.

insert into public.domains (subject, name, sort_order) values ('english', 'Information and Ideas', 1);
insert into public.skills (domain_id, name, slug, sort_order) values
  ((select id from public.domains where subject = 'english' and name = 'Information and Ideas'), 'Central Ideas and Details', 'english-central-ideas-and-details', 1),
  ((select id from public.domains where subject = 'english' and name = 'Information and Ideas'), 'Command of Evidence: Textual', 'english-command-of-evidence-textual', 2),
  ((select id from public.domains where subject = 'english' and name = 'Information and Ideas'), 'Command of Evidence: Quantitative', 'english-command-of-evidence-quantitative', 3),
  ((select id from public.domains where subject = 'english' and name = 'Information and Ideas'), 'Inferences', 'english-inferences', 4);

insert into public.domains (subject, name, sort_order) values ('english', 'Craft and Structure', 2);
insert into public.skills (domain_id, name, slug, sort_order) values
  ((select id from public.domains where subject = 'english' and name = 'Craft and Structure'), 'Words in Context', 'english-words-in-context', 1),
  ((select id from public.domains where subject = 'english' and name = 'Craft and Structure'), 'Text Structure and Purpose', 'english-text-structure-and-purpose', 2),
  ((select id from public.domains where subject = 'english' and name = 'Craft and Structure'), 'Cross-Text Connections', 'english-cross-text-connections', 3);

insert into public.domains (subject, name, sort_order) values ('english', 'Expression of Ideas', 3);
insert into public.skills (domain_id, name, slug, sort_order) values
  ((select id from public.domains where subject = 'english' and name = 'Expression of Ideas'), 'Rhetorical Synthesis', 'english-rhetorical-synthesis', 1),
  ((select id from public.domains where subject = 'english' and name = 'Expression of Ideas'), 'Transitions', 'english-transitions', 2);

insert into public.domains (subject, name, sort_order) values ('english', 'Standard English Conventions', 4);
insert into public.skills (domain_id, name, slug, sort_order) values
  ((select id from public.domains where subject = 'english' and name = 'Standard English Conventions'), 'Boundaries', 'english-boundaries', 1),
  ((select id from public.domains where subject = 'english' and name = 'Standard English Conventions'), 'Form, Structure, and Sense', 'english-form-structure-and-sense', 2);

insert into public.domains (subject, name, sort_order) values ('math', 'Algebra', 1);
insert into public.skills (domain_id, name, slug, sort_order) values
  ((select id from public.domains where subject = 'math' and name = 'Algebra'), 'Linear equations in one variable', 'math-linear-equations-in-one-variable', 1),
  ((select id from public.domains where subject = 'math' and name = 'Algebra'), 'Linear functions', 'math-linear-functions', 2),
  ((select id from public.domains where subject = 'math' and name = 'Algebra'), 'Linear equations in two variables', 'math-linear-equations-in-two-variables', 3),
  ((select id from public.domains where subject = 'math' and name = 'Algebra'), 'Systems of two linear equations in two variables', 'math-systems-of-two-linear-equations-in-two-variables', 4),
  ((select id from public.domains where subject = 'math' and name = 'Algebra'), 'Linear inequalities in one or two variables', 'math-linear-inequalities-in-one-or-two-variables', 5);

insert into public.domains (subject, name, sort_order) values ('math', 'Advanced Math', 2);
insert into public.skills (domain_id, name, slug, sort_order) values
  ((select id from public.domains where subject = 'math' and name = 'Advanced Math'), 'Nonlinear functions', 'math-nonlinear-functions', 1),
  ((select id from public.domains where subject = 'math' and name = 'Advanced Math'), 'Nonlinear equations in one variable and systems of equations in two variables', 'math-nonlinear-equations-in-one-variable-and-systems-of-equations-in-two-variables', 2),
  ((select id from public.domains where subject = 'math' and name = 'Advanced Math'), 'Equivalent expressions', 'math-equivalent-expressions', 3);

insert into public.domains (subject, name, sort_order) values ('math', 'Problem-Solving and Data Analysis', 3);
insert into public.skills (domain_id, name, slug, sort_order) values
  ((select id from public.domains where subject = 'math' and name = 'Problem-Solving and Data Analysis'), 'Ratios, rates, proportional relationships, and units', 'math-ratios-rates-proportional-relationships-and-units', 1),
  ((select id from public.domains where subject = 'math' and name = 'Problem-Solving and Data Analysis'), 'Percentages', 'math-percentages', 2),
  ((select id from public.domains where subject = 'math' and name = 'Problem-Solving and Data Analysis'), 'One-variable data: distributions and measures of center and spread', 'math-one-variable-data-distributions-and-measures-of-center-and-spread', 3),
  ((select id from public.domains where subject = 'math' and name = 'Problem-Solving and Data Analysis'), 'Two-variable data: models and scatterplots', 'math-two-variable-data-models-and-scatterplots', 4),
  ((select id from public.domains where subject = 'math' and name = 'Problem-Solving and Data Analysis'), 'Probability and conditional probability', 'math-probability-and-conditional-probability', 5),
  ((select id from public.domains where subject = 'math' and name = 'Problem-Solving and Data Analysis'), 'Inference from sample statistics and margin of error', 'math-inference-from-sample-statistics-and-margin-of-error', 6),
  ((select id from public.domains where subject = 'math' and name = 'Problem-Solving and Data Analysis'), 'Evaluating statistical claims: observational studies and experiments', 'math-evaluating-statistical-claims-observational-studies-and-experiments', 7);

insert into public.domains (subject, name, sort_order) values ('math', 'Geometry and Trigonometry', 4);
insert into public.skills (domain_id, name, slug, sort_order) values
  ((select id from public.domains where subject = 'math' and name = 'Geometry and Trigonometry'), 'Area and volume', 'math-area-and-volume', 1),
  ((select id from public.domains where subject = 'math' and name = 'Geometry and Trigonometry'), 'Lines, angles, and triangles', 'math-lines-angles-and-triangles', 2),
  ((select id from public.domains where subject = 'math' and name = 'Geometry and Trigonometry'), 'Right triangles and trigonometry', 'math-right-triangles-and-trigonometry', 3),
  ((select id from public.domains where subject = 'math' and name = 'Geometry and Trigonometry'), 'Circles', 'math-circles', 4);
