# OB Code Test

## Rationale

The homework limit teh case to a single currency.

## Set-up

### PostgreSQL

[Install Postgres](https://www.postgresql.org/download/)

To configure PostgreSQL, use the `psql` CLI

```shell
psql postgres
```

From `psql` create
* the `ob` database, administrated by
* the `ob` user
* having `ob` password.

```postgresql
create database ob;
create user on with encrypted password 'ob';
grant all privileges on database ob to ob;
\c ob ob
```

You are now connetcted the `ob` database as `ob` system administrator.

The "market" is represented in the `balances` table.
The following SQL instructions create the table and three balances.

```postgresql
drop table balances;

create table balances
(
    pladdress varchar(42) not null,
    token   varchar(42) not null,
    amount  numeric     not null,
    primary key (address, token)
);

insert into balances(address, token, amount)
values
    ('0x095182ADDea1Dd59221D1750D95f78b0c15B0e1C', '0xF0CACC1A', 128),
    ('0x9D3860f1Fab70216Db9a2bcAb63EE9576da0d926', '0xF0CACC1A', 256),
    ('0x5965c1C60b5191bd270d385589355503f575a136', '0xF0CACC1A', 512);
```


## JS/TS

```shell
yarn install
```

## Run



