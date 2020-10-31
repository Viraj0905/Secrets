# Secrets
In this Project 6 level of security is added step by step
leve1 is Plain text => which save password in plain text in mongoDB on local host.
level2 is encyption => First we need to create a .env file (Note. create file .env only means it doesn't require name at front).
Then, create varibale that store a secret text key (Which help to encryp password to Database and decrypt when user login.)
for Example=> SECRET=ThisisMySecretKey (Note: secret key should copied as it is no semicolin added .)
level3 is Hasing
level4 is Salting and Hashing
level5 is cookie and session
level is uisng external authentication api to check user like Facebook , Google, twiter and so on.
