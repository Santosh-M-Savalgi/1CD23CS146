import express from "express";
import axios from "axios";

const app = express();

app.get("/schedule/:depotId", async (req, res) => {
    try {
        const depotId = req.params.depotId;

        // Protected API
        const headers = {
            Authorization: `Bearer ${process.env.ACCESS_TOKEN}`
        };

        // Fetch depot hours
        const depotResponse = await axios.get(
            "http://4.224.186.213/evaluation-service/depots",
            { headers }
        );

        const depot = depotResponse.data.depots.find(
            d => d.ID == depotId
        );

        // Fetch vehicle tasks
        const taskResponse = await axios.get(
            `http://4.224.186.213/evaluation-service/tasks/${depotId}`,
            { headers }
        );

        const result = scheduleVehicles(
            taskResponse.data.vehicles,
            depot.MechanicHours
        );

        res.json(result);

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
});

app.listen(3000);


function scheduleVehicles(vehicles, mechanicHours) {
    const dp = Array(mechanicHours + 1).fill(0);
    const selected = Array(mechanicHours + 1)
        .fill(null)
        .map(() => []);

    for (const vehicle of vehicles) {
        const duration = vehicle.Duration;
        const impact = vehicle.Impact;

        for (let w = mechanicHours; w >= duration; w--) {
            if (dp[w - duration] + impact > dp[w]) {
                dp[w] = dp[w - duration] + impact;
                selected[w] = [
                    ...selected[w - duration],
                    vehicle
                ];
            }
        }
    }

    return {
        totalImpact: dp[mechanicHours],
        totalDuration: selected[mechanicHours]
            .reduce((sum, v) => sum + v.Duration, 0),
        selectedVehicles: selected[mechanicHours]
    };
}