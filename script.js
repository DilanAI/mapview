var map = L.map('map').setView([7.62823, 80.241], 10);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var points = [];
var markers = [];
var mapClickEnabled = true;

function calculateDistance(lat1, lon1, lat2, lon2) {
    var R = 6371;
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a = 
        0.5 - Math.cos(dLat) / 2 + 
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        (1 - Math.cos(dLon)) / 2;

    return R * 2 * Math.asin(Math.sqrt(a));
}

function distanceFromLine(lat, lng, lat1, lng1, lat2, lng2) {
    var A = lat - lat1;
    var B = lng - lng1;
    var C = lat2 - lat1;
    var D = lng2 - lng1;

    var dot = A * C + B * D;
    var len_sq = C * C + D * D;
    var param = dot / len_sq;

    var xx, yy;

    if (param < 0 || (lat1 == lat2 && lng1 == lng2)) {
        xx = lat1;
        yy = lng1;
    } else if (param > 1) {
        xx = lat2;
        yy = lng2;
    } else {
        xx = lat1 + param * C;
        yy = lng1 + param * D;
    }

    var dLat = lat - xx;
    var dLng = lng - yy;
    return calculateDistance(lat, lng, xx, yy);
}

function findNearbyLocations(points, locations, threshold) {
    var nearbyLocations = [];

    locations.forEach(location => {
        var minDistance = Infinity;

        for (var i = 0; i < points.length - 1; i++) {
            var distance = distanceFromLine(location.lat, location.lng, points[i].lat, points[i].lng, points[i + 1].lat, points[i + 1].lng);
            if (distance < minDistance) {
                minDistance = distance;
            }
        }

        if (minDistance <= threshold) {
            nearbyLocations.push(location);
        }
    });

    return nearbyLocations;
}

function updateTable(locations) {
    var tableBody = document.querySelector('#locations-table tbody');
    tableBody.innerHTML = '';

    // Sort the locations based on their proximity to the last selected point
    const lastPoint = points[points.length - 1]; // Get the last selected point

    const sortedLocations = locations.sort((a, b) => {
        const distanceA = calculateDistance(a.lat, a.lng, lastPoint.lat, lastPoint.lng);
        const distanceB = calculateDistance(b.lat, b.lng, lastPoint.lat, lastPoint.lng);
        return distanceA - distanceB; // Sort in ascending order of distance
    });

    sortedLocations.forEach(location => {
        var row = document.createElement('tr');
        row.innerHTML = `
            <td>${location.name}</td>
        `;
        tableBody.appendChild(row);
    });
}

function onMapClick(e) {
    if (!mapClickEnabled) return;

    var newPoint = e.latlng;
    points.push(newPoint);

    let marker = L.marker(newPoint).addTo(map).bindPopup(`Point ${points.length}`).openPopup();
    markers.push(marker);

    if (points.length > 1) {
        var polyline = L.polyline(points, { color: 'green' }).addTo(map);
        markers.push(polyline);

        var nearbyLocations = findNearbyLocations(points, storedLocations, 10);

        console.log("Nearby locations within 10km:", nearbyLocations);

        nearbyLocations.forEach(location => {
            let nearbyMarker = L.marker([location.lat, location.lng]).addTo(map);
            markers.push(nearbyMarker);
        });

        updateTable(nearbyLocations);

        // Show the table after selecting the first point
        document.querySelector('.info-table').style.display = 'block';
    }
}

map.on('click', onMapClick);
