module.exports = (sequelize, Sequelize) => {
  return sequelize.define('proxy', {
    ip : {
      type : Sequelize.STRING(50),
      allowNull : false,
      unique : true,
    },
    type : {
      type : Sequelize.STRING(20),
      allowNull : false
    },
    latency : {
      type : Sequelize.FLOAT.UNSIGNED,
      allowNull : false
    }
  })
}