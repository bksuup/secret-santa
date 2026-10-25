# Secret Santa - Criteria

1. the web-application wil be posted publicly and therefore there cannot be any unsecured /admin panels exposed.
2. The application needs to be configured with the secret santa participants and their assignee, the application MUST consider that an participant CANNOT get themselves as an assignee.
3. The assignment logic should be ran as a seeder locally by passing in the name of the participants, and output their username (first name) and password
4. In order to reveal who the participants have been assigned to, they will each have a username (their first name) and a randomly generated password. The passwords MUST BE unique to each participant such that no other participanty can see another participants assignment.
