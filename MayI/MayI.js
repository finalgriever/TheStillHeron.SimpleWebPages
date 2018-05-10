MonthlyPay = {
    Game: {
        Players: null,
        Rounds: null,
        GameStarted: null,
        CurrentlyEditing: null,

        AddPlayer: function(playerName) {
            if (Players.length >= 5) {
                alert("You can't play May I with more than 5 players!");
                return;
            }

            Players.push(new MonthlyPay.Player(playerName));
            MonthlyPay.Game.updateHeaderRow();
            if (GameStarted) {
                MonthlyPay.Game.updateScoreTable(Players.length);
            }
            MonthlyPay.Game.beginEditName($(".header-row th:nth-last-child(2)"))
        },

        RemovePlayer: function (index) {
            if (Players.length <= 2) {
                alert("At least two players are needed to play May I");
                return;
            }
            if (!confirm("Are you sure you want to remove " + Players[index].Name)) {
                return;
            }
            // Remove the player's scores
            Rounds.forEach(function (round) {
                delete round.Scores[index];
            });
            var columnIndex = index + 2;
            // Update table and Players collection
            $("#score-board tr *:nth-child(" + columnIndex + ")").remove();
            Players.splice(index, 1);
            MonthlyPay.Game.updateHandlers();
        },

        OnLoad: function () {
            GameStarted = false;
            CurrentlyEditing = false;
            Players = MonthlyPay.DefaultPlayers();
            Rounds = MonthlyPay.DefaultRounds();
            MonthlyPay.Game.createHeaderRow();
        },

        StartGame: function () {
            if (GameStarted) return;
            MonthlyPay.Game.drawRoundRows();
            GameStarted = true;
            MonthlyPay.Game.updateHandlers();
        },

        ResetGame: function () {
            if (!confirm("Are you sure you want to reset the game?")) {
                return;
            }
            if (!GameStarted) return;
            Rounds = MonthlyPay.DefaultRounds();
            CurrentlyEditing = false;
            $("#score-board tr").each(function (index) {
                if (index != 0) {
                    $(this).remove();
                }
            });
            GameStarted = false;
        },

        drawRoundRows: function () {
            var table = $("#score-board");
            Rounds.forEach(function (round, index) {
                var row = MonthlyPay.Game.Components.roundRow(round, index);
                table.append(row);
            });
            table.append(MonthlyPay.Game.Components.totalRow());
        },

        beginEditScore: function (cell) {
            if (MonthlyPay.Game.editOutOfTurn(cell)) {
                MonthlyPay.Game.showBriefError("You haven't finished the previous round yet!");
                return;
            }
            CurrentlyEditing = true;
            var playerIndex = cell.index() - 1;
            var roundIndex = cell.parent().index() - 1;
            cell.empty();
            var box = MonthlyPay.Game.Components.editScoreTextBox();
            cell.append(box);
            var currentScore = typeof Rounds[roundIndex].Scores[playerIndex] !== 'undefined' ? Rounds[roundIndex].Scores[playerIndex] : null;
            box.focus();
            box.val(currentScore);
            MonthlyPay.Game.updateHandlers();
        },

        finishEditScore: function (input) {
            var score = input.val();
            var parent = input.parent();
            var playerIndex = parent.index() - 1;
            var roundIndex = parent.parent().index() - 1;
            if (!MonthlyPay.Game.validateScore(score)) {
                input.focus();
                input[0].setSelectionRange(0, 1000);
                return false;
            } else {
                MonthlyPay.Game.hideError();
            }
            Rounds[roundIndex].Scores[playerIndex] = score;
            parent.empty();
            parent.append(score);
            MonthlyPay.Game.updateTotals();
            MonthlyPay.Game.updateLeadership();
            CurrentlyEditing = false;
            MonthlyPay.Game.updateHandlers();
            return true;
        },

        beginEditName: function (cell) {
            CurrentlyEditing = true;
            var span = $("span", cell);
            var playerIndex = cell.index() - 1;
            span.empty();
            var box = MonthlyPay.Game.Components.editNameTextBox();
            span.append(box);
            box.focus();
            box.val(Players[playerIndex].Name);
            box[0].setSelectionRange(0, 1000);
            MonthlyPay.Game.updateHandlers();
        },

        finishEditName: function (input) {
            var newName = input.val();
            var span = input.parent();
            var cell = span.parent();
            var playerIndex = cell.index() - 1;
            Players[playerIndex].Name = newName;
            span.empty();
            span.append(newName);
            CurrentlyEditing = false;
            MonthlyPay.Game.updateHandlers();
        },

        validateScore: function (score) {
            if (typeof score === 'undefined') {
                return true;
            }
            if (parseInt(score) == 0) {
                return true;
            }
            if (isNaN(score)) {
                MonthlyPay.Game.showError("The score must be a number!");
                return false;
            }
            if (score > 260) {
                MonthlyPay.Game.showError("The score couldn't possibly be higher than 260!");
                return false;
            }
            if (score % 5 != 0) {
                MonthlyPay.Game.showError("The score must be divisible by 5!");
                return false;
            }
            return true;
        },

        editOutOfTurn: function(cell) {
            var roundIndex = cell.parent().index() - 1;
            var outOfTurn = false;
            for (var i = 0; i < roundIndex; i++) {
                Players.forEach(function(player, playerIndex) {
                    if (!Rounds[i].Scores.hasOwnProperty(playerIndex))
                        outOfTurn =  true;
                });
            }
            return outOfTurn;
        },

        mouseOverOutOfTurn: function(cell) {
            if (MonthlyPay.Game.editOutOfTurn(cell)) {
                cell.css("cursor", "not-allowed");
            } else {
                cell.css("cursor", "text");
            }
        },

        updateHandlers: function () {
            $("*").unbind();
            $("input#start-game").click(function () { MonthlyPay.Game.StartGame(); });
            $("input#reset-game").click(function () { MonthlyPay.Game.ResetGame(); });
            $("input.add-player-button").click(function () { MonthlyPay.Game.AddPlayer("..."); });
            $("img.remove-player-button").click(function (e) {
                e.stopPropagation();
                MonthlyPay.Game.RemovePlayer($(this).parent().index() - 1)
            });
            if (!CurrentlyEditing) {
                $("th.player-name").click(function () { MonthlyPay.Game.beginEditName($(this)); });
                $("td.score-cell").click(function () { MonthlyPay.Game.beginEditScore($(this)); });
                $("td.score-cell").on("mouseover", function () { MonthlyPay.Game.mouseOverOutOfTurn($(this)); });
            }
            $("input.edit-score-textbox").on("blur", function () { MonthlyPay.Game.finishEditScore($(this)); });
            $("input.edit-score-textbox").keypress(function (e) {
                if (e.which == 13) { // Catch enter key
                    e.preventDefault();
                    MonthlyPay.Game.finishEditScore($(this));
                    return false;
                }
            });
            $("input.edit-score-textbox").keydown(function (e) {
                if (e.which == 9) { // Catch tab key
                    e.preventDefault();
                    MonthlyPay.Game.tabInEditScore($(this));
                    return false;
                }
            });
            $("input.edit-name-textbox").on("blur", function () { MonthlyPay.Game.finishEditName($(this)) });
            $("input.edit-name-textbox").keypress(function (e) {
                if (e.which == 13) { // Catch enter key
                    e.preventDefault();
                    MonthlyPay.Game.finishEditName($(this));
                    return false;
                }
            });
            $("input.edit-name-textbox").keydown(function (e) {
                if (e.which == 9) { // Catch tab key
                    e.preventDefault();
                    MonthlyPay.Game.tabInEditName($(this));
                    return false;
                }
            });
        },

        updateScoreTable: function(newPlayerLength) {
            var scoreCell = MonthlyPay.Game.Components.roundCell();
            $(".round-row").append(scoreCell);

            var indexOfWorst = MonthlyPay.Game.findPlayerWithHighestTotal();
            var total = 0;
            Rounds.forEach(function (round, roundIndex) { // Player gets same scores as current worst
                var currentRow = $($(".round-row")[roundIndex]);
                var scoreOfWorst = round.Scores[indexOfWorst];
                Rounds[roundIndex].Scores[newPlayerLength - 1] = scoreOfWorst;
                $("td:last-child", currentRow).append(scoreOfWorst);
                if (!isNaN(scoreOfWorst)) {
                    total += parseInt(scoreOfWorst);
                }
            });
            // Add total to totals row
            var totalCell = MonthlyPay.Game.Components.totalCell();
            totalCell.append(total);
            $(".total-row").append(totalCell);
        },

        tabInEditName: function (input) {
            var cell = input.parent().parent();
            MonthlyPay.Game.finishEditName(input);
            var siblings = cell.siblings();
            var index = cell.index();
            if (cell.index() == cell.siblings().length - 1) { // I am the last name cell, don't tab
                return;
            }
            MonthlyPay.Game.beginEditName(cell.next());
        },

        tabInEditScore: function (input) {
            var parent = input.parent();
            if (!MonthlyPay.Game.finishEditScore(input)) {
                return;
            }
            var nextCell;
            if (parent.index() == parent.siblings().length) { // I am the last score cell, try to tab to next row
                var row = parent.parent();
                if (row.index() == row.siblings().length - 1) { // I am the last score cell on the last score row, don't tab
                    return;
                } else { // Get the first score cell of the next row
                    var nextRow = row.next();
                    nextCell = $($("td", $(nextRow[0]))[0]);
                }
            } else { // Get the next score cell in this row
                nextCell = parent.next();
            }
            MonthlyPay.Game.beginEditScore(nextCell);
        },

        showBriefError: function(message) {
            MonthlyPay.Game.showError(message);
            setTimeout(function () {
                MonthlyPay.Game.hideError();
            }, 3500)
        },

        showError: function(message) {
            $("span.error").empty();
            $("span.error").append(message);
            $("div.error").show();
        },

        hideError: function() {
            $("div.error").fadeOut(1000);
        },

        findPlayerWithHighestTotal: function () {
            var totalCells = $(".total-cell");
            var highestTotal = 0;
            var highestIndex = 0;
            totalCells.each(function (index) {
                var value = parseInt($(this).text());
                if (value > highestTotal) {
                    highestTotal = value;
                    highestIndex = index;
                }
            });

            return highestIndex;
        },

        createHeaderRow: function () {
            // Create the row
            var row = $("<tr></tr>");
            row.addClass("header-row");
            // Put the row at the top of the table
            $("table#score-board").append(row);
            // Populate the row
            MonthlyPay.Game.updateHeaderRow();
        },

        updateHeaderRow: function () {
            var row = $(".header-row");
            row.empty();
            // Define headers for each player
            row.append($("<th class='round-header'>Round</th>"));
            Players.forEach(function (player, index) {
                row.append(MonthlyPay.Game.Components.headerCell(player.Name, index));
            });
            // Add "Add players" button
            row.append(MonthlyPay.Game.Components.addPlayerButton);
            MonthlyPay.Game.updateHandlers();
        },

        updateTotals: function () {
            Players.forEach(function (player, playerIndex) {
                var total = 0;
                Rounds.forEach(function (round, roundIndex) {
                    total += typeof round.Scores[playerIndex] !== 'undefined' ? parseInt(round.Scores[playerIndex]) : 0;
                });
                var columnIndex = playerIndex + 2;
                var cell = $(".total-row *:nth-child(" + columnIndex + ")");
                cell.empty();
                cell.append(total);
            });
        },

        updateLeadership: function () {
            Rounds.forEach(MonthlyPay.Game.updateRoundLeadership);
            MonthlyPay.Game.updateTotalLeadership();
        },

        updateRoundLeadership: function (round, roundIndex) {
            var roundLeaderIndex;
            var lowestValue = 1000;
            var roundComplete = true;
            Players.forEach(function (player, playerIndex) {
                if (!round.Scores.hasOwnProperty(playerIndex)) {
                    roundComplete = false;
                }
				var score = typeof round.Scores[playerIndex] == "number" ? round.Scores[playerIndex] : parseInt(round.Scores[playerIndex]);
                if (score < lowestValue) {
                    lowestValue = score;
                    roundLeaderIndex = playerIndex;
                }
            });
            if (!roundComplete) {
                return;
            }
            var cellNumber = roundLeaderIndex + 2;
            var row = $($(".round-row")[roundIndex]);
            $("*", $(row[0])).removeClass("round-leader");
            $("*:nth-child(" + cellNumber + ")", $(row[0])).addClass("round-leader");
        },

        updateTotalLeadership: function() {
            var lowestTotal = 1000;

            $(".total-row td").each(function (index) {
                if(isNaN($(this).text())) {
                    return;
                }
                var total = parseInt($(this).text());
                if (total < lowestTotal) {
                    lowestTotal = total;
                }
			});
			$(".total-row td").removeClass("total-leader");
			$(".total-row td").each(function (index) {
				if(isNaN($(this).text())) {
					return;
				}
				if(parseInt($(this).text()) == lowestTotal) {
					$(this).addClass("total-leader");
				}
			});
        },

        Components: {
            addPlayerButton: function () {
                var cell = $("<th></th>");
                var button = $("<input type='button' />");
                cell.addClass("add-player-button-cell");
                button.attr("value", "+");
                button.addClass("add-player-button");
                return cell.append(button);
            },

            editScoreTextBox: function () {
                var box = $("<input type='number' />");
                box.addClass("edit-score-textbox");
                return box;
            },

            editNameTextBox: function () {
                var box = $("<input type='text' />");
                box.addClass("edit-name-textbox");
                return box;
            },

            totalCell: function (playerIndex) {
                var cell = $("<td></td>");
                cell.addClass("total-cell");
                return cell;
            },

            roundCell: function () {
                var cell = $("<td></td>");
                cell.addClass("score-cell");
                return cell;
            },

            headerCell: function (playerName, playerIndex) {
                var cell = $("<th></th>");
                cell.addClass("player-name");
                cell.append("<span>" + playerName + "</span>");
                var button = $("<img src='minus.png' />");
                //button.attr("value", "-");
                button.addClass("remove-player-button");
                cell.append(button);
                return cell;
            },

            totalRow: function () {
                var row = $("<tr></tr>");
                row.addClass("total-row");
                var header = $("<th>Total:</th>");
                header.addClass("total-header");
                row.append(header);
                Players.forEach(function (player, index) {
                    var cell = MonthlyPay.Game.Components.totalCell(index);
                    row.append(cell);
                });
                return row;
            },

            roundRow: function (round, roundIndex) {
                var row = $("<tr></tr>");
                row.addClass("round-row");
                var header = $("<th>" + round.Title + "</th>");
                header.addClass("round-header");
                row.append(header);
                Players.forEach(function (player, playerIndex) {
                    var cell = MonthlyPay.Game.Components.roundCell(roundIndex, playerIndex);
                    row.append(cell);
                });
                return row;
            },
        },
    },

    Player: function (name) {
        this.Name = typeof name !== 'undefined' ? name : "...";
        this.Scores = [];
    },

    Round: function(title) {
        this.Title = typeof title !== 'undefined' ? title : "";
        this.Scores = {};
    },

    DefaultRounds: function () {
        return [
            new MonthlyPay.Round("3x3"),
            new MonthlyPay.Round("3x4"),
            new MonthlyPay.Round("4x4"),
            new MonthlyPay.Round("3x3x3"),
            new MonthlyPay.Round("3x3x4"),
            new MonthlyPay.Round("3x4x4"),
            new MonthlyPay.Round("4x4x4")
        ];
    },

    DefaultPlayers: function () {
        return [
            new MonthlyPay.Player("..."), new MonthlyPay.Player("...")
        ];
    }
};

$(document).ready(function() {
	window.addEventListener("beforeunload", function (e) {
		var confirmationMessage = 'Are you sure you\'re ready to leave?';

		(e || window.event).returnValue = confirmationMessage; //Gecko + IE
		return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
	});

	MonthlyPay.Game.OnLoad();
});
