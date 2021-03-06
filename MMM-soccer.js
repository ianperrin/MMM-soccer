/* Magic Mirror
 * Module: MMM-soccer
 *
 * By fewieden https://github.com/fewieden/MMM-soccer
 *
 * MIT Licensed.
 */

Module.register("MMM-soccer",{

    defaults: {
        api_key: false,
        show: 'GERMANY',
        focus_on: false,  // false or the name of a team to focus on (used with max_teams)
        max_teams: false,   // false or the number of teams to show either side of the focused team
        leagues: {
            "GERMANY":430,
            "FRANCE": 434,
            "ENGLAND": 426,
            "SPAIN": 436,
            "ITALY": 438
        }
    },

    // A loading boolean.
    loading: true,

    // Subclass start method.
    start: function() {
        Log.info("Starting module: " + this.name);
        this.currentLeague = this.config.leagues[this.config.show];
        this.getData();

        this.getData();
        var self = this;
        setInterval(function() {
            self.getData();
        }, this.config.api_key ? 300000 : 1800000); // with api_key every 5min without every 30min
    },

    getData: function(){
        this.sendSocketNotification('GET_DATA', {league: this.currentLeague, api_key: this.config.api_key});
    },

    // Subclass socketNotificationReceived method.
    socketNotificationReceived: function(notification, payload){
        if(notification === 'DATA'){
            this.standing = payload;
            this.loading = (!this.standing);
            this.updateDom();
        }
    },

    // Subclass getStyles method.
    getStyles: function() {
        return ["font-awesome.css", "MMM-soccer.css"];
    },

    getTranslations: function() {
        return {
            en: "translations/en.json",
            de: "translations/de.json"
        };
    },

    // Override dom generator.
    getDom: function() {
        var wrapper = document.createElement("div");

        if (this.loading ||
            !this.standing) {
            var title = document.createElement("header");
            title.innerHTML = this.name;
            wrapper.appendChild(title);

            var subtitle = document.createElement("div");
            subtitle.classList.add("small", "dimmed", "light");
            subtitle.innerHTML = (this.loading) ? this.translate("LOADING") : this.translate("NO_DATA_AVAILABLE");
            wrapper.appendChild(subtitle);

            return wrapper;
        }

        // Generate Standings Table
        if(this.standing){
            // League header
            var title = document.createElement("header");
            title.innerHTML = this.standing.leagueCaption;
            wrapper.appendChild(title);

            // Matchday indicator
            var subtitle = document.createElement("p");
            subtitle.classList.add("xsmall");
            subtitle.innerHTML = this.translate("MATCHDAY") + ": " + this.standing.matchday;
            wrapper.appendChild(subtitle);

            // Standings container
            var table = document.createElement('table');
            table.classList.add('xsmall', 'table');

            // Standings header row
            var row = document.createElement('tr');
            row.classList.add('row');

            var position = document.createElement('th');
            row.appendChild(position);

            var logo = document.createElement('th');
            row.appendChild(logo);

            var name = document.createElement('th');
            name.classList.add('name');
            name.innerHTML = this.translate("TEAM");
            row.appendChild(name);

            var pointsLabel = document.createElement('th');
            pointsLabel.classList.add('centered');
            var points = document.createElement('i');
            points.classList.add('fa', 'fa-line-chart');
            pointsLabel.appendChild(points);
            row.appendChild(pointsLabel);

            var goalsLabel = document.createElement('th');
            goalsLabel.classList.add('centered');
            var goals = document.createElement('i');
            goals.classList.add('fa', 'fa-soccer-ball-o');
            goalsLabel.appendChild(goals);
            row.appendChild(goalsLabel);

            table.appendChild(row);

            // Get First and Last teams to display in standings
            var focusTeamIndex, firstTeam, lastTeam;

            /* focus_on for current league is set */
            if(this.config.focus_on && this.config.focus_on.hasOwnProperty(this.config.show)){
                /* focus_on TOP */
                if(this.config.focus_on[this.config.show] === 'TOP'){
                    focusTeamIndex = -1;
                    firstTeam = 0;
                    lastTeam = (this.config.max_teams && this.config.max_teams <= this.standing.standing.length) ? this.config.max_teams : this.standing.standing.length;
                }
                /* focus_on BOTTOM */
                else if(this.config.focus_on[this.config.show] === 'BOTTOM'){
                    focusTeamIndex = -1;
                    firstTeam = (this.config.max_teams && this.config.max_teams <= this.standing.standing.length) ? this.standing.standing.length - this.config.max_teams : 0;
                    lastTeam = this.standing.standing.length;
                }
                /* focus_on specific team */
                else {
                    for(var i = 0; i < this.standing.standing.length; i++){
                        /* focus_on is teamName */
                        if(this.standing.standing[i].teamName === this.config.focus_on[this.config.show]){
                            focusTeamIndex = i;
                            /* max_teams is set */
                            if(this.config.max_teams){
                                var before = parseInt(this.config.max_teams / 2);
                                firstTeam = focusTeamIndex - before >= 0 ? focusTeamIndex - before : 0;
                                /* index for lastTeam is in range */
                                if(firstTeam + this.config.max_teams <= this.standing.standing.length){
                                    lastTeam =  firstTeam + this.config.max_teams;
                                } else {
                                    lastTeam = this.standing.standing.length;
                                    firstTeam = lastTeam - this.config.max_teams >= 0 ? lastTeam - this.config.max_teams : 0;
                                }
                            } else {
                                firstTeam = 0;
                                lastTeam = this.standing.standing.length;
                            }
                            break;
                        }
                    }
                }
            } else {
                focusTeamIndex = -1;
                firstTeam = 0;
                lastTeam = this.config.max_teams || this.standing.standing.length;
            }

            // Render Team Rows
            for(var i = firstTeam; i < lastTeam; i++){
                var row = document.createElement('tr');
                row.classList.add('centered-row');
                if(i === focusTeamIndex){
                    row.classList.add('bright');
                }

                var pos = document.createElement('td');
                pos.innerHTML = this.standing.standing[i].position;
                row.appendChild(pos);

                var logo = document.createElement('td');
                var icon = document.createElement('img');
                icon.classList.add('icon');
                if (this.standing.standing[i].crestURI != "null"){
                    icon.src = this.standing.standing[i].crestURI;   // API returns "null" for teams without a crest
                }
                logo.appendChild(icon);
                row.appendChild(logo);

                var name = document.createElement('td');
                name.classList.add('name');
                name.innerHTML = this.standing.standing[i].teamName;
                row.appendChild(name);

                var points = document.createElement('td');
                points.innerHTML = this.standing.standing[i].points;
                points.classList.add('centered');
                row.appendChild(points);

                var goals = document.createElement('td');
                goals.innerHTML = this.standing.standing[i].goalDifference;
                goals.classList.add('centered');
                row.appendChild(goals);

                // Create fade in/out effect.
                if (this.config.max_teams && focusTeamIndex >= 0) {
                    if (i != focusTeamIndex) {
                        var currentStep = Math.abs(i - focusTeamIndex);
                        row.style.opacity = 1 - (1 / this.config.max_teams * currentStep);
                    }
                }

                table.appendChild(row);
            }
            wrapper.appendChild(table);
        }
        return wrapper;
    }
});
