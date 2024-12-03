sap.ui.define([
    "sap/ui/model/SimpleType",
  ], Type => Type.extend('sd.salesdocumentreport.controller.CustomDecimal', {
    constructor: function() {
      Type.apply(this, arguments);
    },
    //三个方法的触发顺序 parseValue（）->validateValue（）->formatValue（）。
    //参考：https://community.sap.com/t5/technology-blogs-by-sap/custom-data-types-in-sapui5/ba-p/13227939

    // 其实并没有小数相关的内容，目前只是将数量0显示为空白，如果需要控制小数位或者千分位，还需要继续处理
    parseValue: bValue => { return bValue }, //可以将值转换成内部值
    validateValue: vValue => { /*validate...*/ },
    formatValue: iValue => { return Number(iValue) === 0 ? "" : iValue },//接收内部值来格式化
  }));