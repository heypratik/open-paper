import { Sequelize } from 'sequelize';
import pg from 'pg';

const sequelize = new Sequelize(`${process.env.NEXT_PUBLIC_POSTGRESS}`, {
    dialectModule: pg,
    dialect: 'postgres',
});

module.exports = sequelize;
