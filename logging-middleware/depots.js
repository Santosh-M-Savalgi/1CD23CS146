import express from "express";

const app = express();

app.use(express.json());

const PORT = 3000;

//camt put it in .env as its not allowed here

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJzbXNhdmFsZ2kxOUBnbWFpbC5jb20iLCJleHAiOjE3ODI3MTgxNDUsImlhdCI6MTc4MjcxNzI0NSwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6IjU5OGJkZTg2LWE4M2ItNGNmMC04ZWU3LTViNDNhMzU4NGM1YyIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6InNhbnRvc2ggbSBzYXZhbGdpIiwic3ViIjoiOWRjZDY3ZWItZjNjYy00YzhlLWJkMTAtYjliNzk1MDA5YTNmIn0sImVtYWlsIjoic21zYXZhbGdpMTlAZ21haWwuY29tIiwibmFtZSI6InNhbnRvc2ggbSBzYXZhbGdpIiwicm9sbE5vIjoiMWNkMjNjczE0NiIsImFjY2Vzc0NvZGUiOiJBcG5wVG0iLCJjbGllbnRJRCI6IjlkY2Q2N2ViLWYzY2MtNGM4ZS1iZDEwLWI5Yjc5NTAwOWEzZiIsImNsaWVudFNlY3JldCI6ImdRU2ZoSlRIQ1FGRWF0REUifQ.DEZlLITW-VdxOXSm4MunpgbNkc6OlJHKfRJU9VZBbp4";


function scheduleVehicles(vehicles, mechanicHours) {

    const dp = Array(mechanicHours + 1).fill(0);

    const selected = Array(mechanicHours + 1)
        .fill(null)
        .map(() => []);

    for (const vehicle of vehicles) {

        const duration = vehicle.Duration;
        const impact = vehicle.Impact;

        for (let j = mechanicHours; j >= duration; j--) {

            if (dp[j - duration] + impact > dp[j]) {

                dp[j] = dp[j - duration] + impact;

                selected[j] = [
                    ...selected[j - duration],
                    vehicle
                ];
            }
        }
    }

    return {
        TotalImpact: dp[mechanicHours],
        TotalDuration: selected[mechanicHours].reduce(
            (sum, v) => sum + v.Duration,
            0
        ),
        SelectedTasks: selected[mechanicHours]
    };
}


app.get("/schedule/:depotId", async (req, res) => {

    try {

        const depotId = Number(req.params.depotId);

       
        const depotResponse = await fetch(
            "http://4.224.186.213/evaluation-service/depots",
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${TOKEN}`
                }
            }
        );

        if (!depotResponse.ok) {
            return res.status(depotResponse.status).json({
                message: "Unable to fetch depots"
            });
        }

        const depotData = await depotResponse.json();

        console.log("Depot Data:", depotData);

        if (!depotData.depots) {
            return res.status(500).json({
                message: "Invalid depot response",
                response: depotData
            });
        }

        const depot = depotData.depots.find(
            d => d.ID === depotId
        );

        if (!depot) {
            return res.status(404).json({
                message: "Depot not found"
            });
        }

       
        const taskResponse = await fetch(
            `http://4.224.186.213/evaluation-service/tasks/${depotId}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${TOKEN}`
                }
            }
        );

        if (!taskResponse.ok) {
            return res.status(taskResponse.status).json({
                message: "Unable to fetch tasks"
            });
        }

        const taskData = await taskResponse.json();

        console.log("Task Data:", taskData);

        if (!taskData.vehicles) {
            return res.status(500).json({
                message: "Invalid task response",
                response: taskData
            });
        }

        const result = scheduleVehicles(
            taskData.vehicles,
            depot.MechanicHours
        );

        res.json({
            DepotID: depot.ID,
            MechanicHours: depot.MechanicHours,
            ...result
        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({
            message: err.message
        });

    }

});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});