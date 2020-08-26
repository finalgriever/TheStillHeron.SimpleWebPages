MonthlyPay = {
  originalPayDate: Date.parse("2018-04-19"),
  startDate: new Date(),
  firstPay: null,
  balance: 0,
  months: 24,
  salary: 7140,
  spend: 2364,
  rentSplit: 170,
  rentIn: 1194,

  OnLoad: function () {
    MonthlyPay.firstPay = MonthlyPay.getFirstPay();
    MonthlyPay.populateDefaults();
    MonthlyPay.updateHandlers();
    MonthlyPay.runCalculation();
  },

  populateDefaults: function () {
    $("#startDate").val(MonthlyPay.startDate.toISOString().split("T")[0]);
    $("#firstPay").val(MonthlyPay.firstPay.toISOString().split("T")[0]);
    $("#balance").val(MonthlyPay.balance);
    $("#months").val(MonthlyPay.months);
    $("#salary").val(MonthlyPay.salary);
    $("#rentSplit").val(MonthlyPay.rentSplit);
    $("#rentIn").val(MonthlyPay.rentIn);
    $("#spend").val(MonthlyPay.spend);
  },

  updateHandlers: function () {
    $(".inputs input").on("keyup", MonthlyPay.runCalculation);
  },

  addDays: function (date, days) {
    var temp = new Date(date);
    temp.setDate(temp.getDate() + days);
    date = new Date(temp);

    return date;
  },

  getFirstPay: function () {
    var now = new Date();
    var firstPay = new Date(MonthlyPay.originalPayDate);

    while (firstPay < now) {
      firstPay = MonthlyPay.addDays(firstPay, 14);
    }

    return firstPay;
  },

  getCreditLine: function (item) {
    return (
      "<tr><td>" +
      item.date.toISOString().split("T")[0] +
      "</td><td>" +
      item.header +
      "</td><td>" +
      item.balance +
      "</td><td>" +
      item.credit +
      "</td><td>&nbsp;</td><td>" +
      item.lowest +
      "</td></tr>"
    );
  },

  getDebitLine: function (item) {
    return (
      "<tr><td>" +
      item.date.toISOString().split("T")[0] +
      "</td><td>" +
      item.header +
      "</td><td>" +
      item.balance +
      "</td><td>&nbsp;</td><td>" +
      item.debit +
      "</td><td>" +
      item.lowest +
      "</td></tr>"
    );
  },

  runCalculation: function () {
    var startDate = $("#startDate")[0].valueAsDate;
    var firstPay = $("#firstPay")[0].valueAsDate;
    var balance = Number($("#balance").val());
    var months = Number($("#months").val());
    var salary = Number($("#salary").val());
    var rentSplit = Number($("#rentSplit").val());
    var rentIn = Number($("#rentIn").val());
    var spend = Number($("#spend").val());
    var originalDay = startDate.getDate();

    var fortnightlyCost = spend;
    var monthCount = 0;
    var currentDate = new Date(startDate);
    var dayCount =
      14 -
      Math.ceil(
        Math.abs(startDate.getTime() - firstPay.getTime()) / (1000 * 3600 * 24)
      );
    var lowestBalance = 99999999;
    var logBody = $(".log-body");
    logBody.empty();

    var lines = [];
    while (monthCount <= months) {
      if (currentDate.getDate() === 2) {
        balance += rentIn;
        lines.push({
          date: currentDate,
          header: "Rent",
          balance: balance,
          credit: rentIn,
        });
      } else if (currentDate.getDate() === 15) {
        balance += salary;
        lines.push({
          date: currentDate,
          header: "Salary",
          balance: balance,
          credit: salary,
        });
      }
      if (dayCount === 14) {
        balance = balance - fortnightlyCost;
        lines.push({
          date: currentDate,
          header: "Spend",
          balance: balance,
          debit: fortnightlyCost,
        });
        balance = balance - rentSplit;
        lines.push({
          date: currentDate,
          header: "Rent split",
          balance: balance,
          debit: rentSplit,
        });
        dayCount = 0;
      }
      if (originalDay === currentDate.getDate()) {
        monthCount++;
      }

      lowestBalance = lowestBalance > balance ? balance : lowestBalance;
      currentDate = MonthlyPay.addDays(currentDate, 1);
      dayCount++;
    }

    var lowest = 99999999;
    for (var i = lines.length - 1; i >= 0; i--) {
      if (lines[i].balance < lowest) {
        lowest = lines[i].balance;
      }
      lines[i].lowest = lowest;
    }

    for (var i = 0; i < lines.length; i++) {
      if (!!lines[i].credit) {
        $(".log-body").append(MonthlyPay.getCreditLine(lines[i]));
      } else {
        $(".log-body").append(MonthlyPay.getDebitLine(lines[i]));
      }
    }

    /*
        while(monthCount <= months) {
            if(currentDate.getDate() === 2) {
                balance += rentIn;
				logBody.append(MonthlyPay.getCreditLine(currentDate, "Rent", balance, rentIn));
            } else if(currentDate.getDate() === 15) {
                balance += salary;
				logBody.append(MonthlyPay.getCreditLine(currentDate, "Salary", balance, salary));
            }
            if(dayCount === 14) {
				balance = balance - fortnightlyCost;
				logBody.append(MonthlyPay.getDebitLine(currentDate, "Spend", balance, fortnightlyCost));
				balance = balance - rentSplit;
				logBody.append(MonthlyPay.getDebitLine(currentDate, "Rent split", balance, rentSplit));
                dayCount = 0;
            }
            if(originalDay === currentDate.getDate()) {
                monthCount++;
            }

            lowestBalance = lowestBalance > balance ? balance : lowestBalance;
            currentDate = MonthlyPay.addDays(currentDate, 1);
            dayCount++;
        }
        */

    $("#result").val(lowestBalance);
  },
};

$(document).ready(function () {
  MonthlyPay.OnLoad();
});
