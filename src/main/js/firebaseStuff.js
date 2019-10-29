var firebaseConfig = {
apiKey: "AIzaSyDYv3k6dFhoQaY0vNPLPkuzShz6fqkyZhw",
authDomain: "iiser-android.firebaseapp.com",
databaseURL: "https://iiser-android.firebaseio.com",
projectId: "iiser-android",
storageBucket: "iiser-android.appspot.com",
messagingSenderId: "362205567920",
appId: "1:362205567920:web:06042a636560fc2e"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();
db.enablePersistence()
    .catch(function(err) {
        console.log(err.code);
    });
var dateOptions = {month:'long', day:'numeric'};
var timeOptions = {hour:'2-digit', minute:'2-digit'}
var tableObject = document.getElementById("table")
db.collection("events").orderBy("time", "desc").get().then(function(querySnapshot) {
    querySnapshot.forEach(function(doc) {
        // doc.data() is never undefined for query doc snapshots
        var row = tableObject.insertRow(-1);
        //Add title
        row.insertCell(0).innerHTML = doc.data()["title"];
        row.insertCell(1).innerHTML = doc.data()["user"];
        var date = new Date(doc.data()["time"]);
        row.insertCell(2).innerHTML = date.toLocaleString("en-US", dateOptions);
        row.insertCell(3).innerHTML = date.toLocaleString("en-US", timeOptions);
        row.insertCell(4).innerHTML = doc.data()["location"];
        row.insertCell(5).innerHTML = doc.data()["description"];
    });
});
