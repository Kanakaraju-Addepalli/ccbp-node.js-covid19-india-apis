const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://loclahost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
};
initializeDBAndServer();

//API 1
app.get("/states/", async (request, response) => {
  const statesQuery = `
        SELECT 
            state_id as stateId,
            state_name as stateName,
            population
        FROM
            state;`;
  const statesArray = await db.all(statesQuery);
  response.send(statesArray);
});

// API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getState = `
        SELECT 
            state_id as stateId,
            state_name as stateName,
            population
        FROM
            state
        WHERE
            state_id = ${stateId};`;
  const state = await db.get(getState);
  response.send(state);
});

// API 3
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const insertDistrictQuery = `
    INSERT INTO
        district (state_id, district_name, cases, cured, active, deaths)
    VALUES
        (${stateId}, '${districtName}', ${cases}, ${cured}, ${active}, ${deaths});`;

  await db.run(insertDistrictQuery);
  response.send("District Successfully Added");
});

// API 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrict = `
        SELECT 
            district_id as districtId,
            district_name as districtName,
            state_id as stateId,
            cases,
            cured,
            active,
            deaths
        FROM
            district
        WHERE
            district_id = ${districtId};`;
  const district = await db.get(getDistrict);
  response.send(district);
});

//API 5

app.delete("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
         DELETE FROM district
         WHERE
            district_id = ${districtId};
        `;
  await db.run(deleteQuery);
  response.send(`District Removed`);
});

//API 6
app.put("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    deaths,
    active,
  } = districtDetails;
  const updateDistrictQuery = `
    update district 
    set 
    district_name="${districtName}",
    state_id = ${stateId},
    cases= ${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths}
    where district_id = ${districtId};
    `;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});
//API 7

app.get("/states/:stateId/stats/", async (request, response) => {
  var stateId = request.params.stateId;
  const getStateStatsQuery = `
    select
    sum(cases) as total_cases,
    sum(cured) as cured_cases,
    sum(active) as active_cases,
    sum(deaths) as total_deaths
    from
    state left join district on district.state_id = state.state_id
    where state.state_id=${stateId};
    `;
  const stateStats = await db.get(getStateStatsQuery);
  const getStateStatsResponse = {
    totalCases: stateStats.total_cases,
    totalCured: stateStats.cured_cases,
    totalActive: stateStats.active_cases,
    totalDeaths: stateStats.total_deaths,
  };
  response.send(getStateStatsResponse);
});

//API 8

app.get("/districts/:districtId/details/", async (request, response) => {
  const districtId = request.params.districtId;
  const districtStateQuery = `
    select
    state_name
    from
    state left join district on state.state_id = district.state_id
    where district_id = ${districtId};
    `;
  const districtState = await db.get(districtStateQuery);
  const districtStateResponse = {
    stateName: districtState.state_name,
  };
  response.send(districtStateResponse);
});

module.exports = app;
