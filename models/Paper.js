const { DataTypes } = require('sequelize');
const sequelize = require('./../src/lib/db');

const Paper = sequelize.define('Paper', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    authors: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
    },
    abstractTitle: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    abstract: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    pdfUrl: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    pdfId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    paperDate: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    imageProcessed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    }
    
    }, {
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });

module.exports = Paper;