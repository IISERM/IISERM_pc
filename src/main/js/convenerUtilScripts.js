var firebaseConfig = {
  apiKey: "AIzaSyDYv3k6dFhoQaY0vNPLPkuzShz6fqkyZhw",
  authDomain: "iiser-android.firebaseapp.com",
  databaseURL: "https://iiser-android.firebaseio.com",
  projectId: "iiser-android",
  storageBucket: "iiser-android.appspot.com",
  messagingSenderId: "362205567920",
  appId: "1:362205567920:web:ad7dc318a0ddcc4052d475"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

var db = firebase.firestore();
var username = "null";
var timeinmills = null;
// init pickers
document.addEventListener('DOMContentLoaded', function() {
    options = {format:"dddd - dd mmmm, yyyy"}
    var elems = document.querySelectorAll('.datepicker');
    var instances = M.Datepicker.init(elems, options);
});
document.addEventListener('DOMContentLoaded', function() {
    options = {vibrate:false, twelveHour:false, onSelect:function(hour, minute){
        timeinmills=(hour*3600+minute*60)*1000
    }}
    var elems = document.querySelectorAll('.timepicker');
    var instances = M.Timepicker.init(elems, options);
});
function signin(){
    document.getElementById('signinbtn').disabled=true;
    email = document.getElementById('usnm').value;
    password = document.getElementById('pswd').value;
    firebase.auth().signInWithEmailAndPassword(email, password).then(function() {
        // Signin success
        M.toast({html:"Success!", classes:"rounded"})
        document.getElementById('eventsform').style.display="inherit";
        document.getElementById('signinform').style.display="none";
        document.getElementById('header').innerHTML="Add your details"
        var user = firebase.auth().currentUser;
        if (user) {
            uid = user.uid
            var docRef = db.collection("users").doc(uid);
            docRef.get().then(function(doc) {
                if (doc.exists) {
                    console.log("Document data:", doc.data().name);
                    username = doc.data().name;
                } else {
                    // doc.data() will be undefined in this case
                    console.log("No such document!");
                }
            }).catch(function(error) {
                console.log("Error getting document:", error);
            });

        } else {
             M.toast({html: "Error. Try refreshing and signin again.", classes: 'rounded'});
        }
    }).catch(function(error) {
        // Handle Errors here.
        switch(error.code){
            case "auth/wrong-password":
                M.toast({html: "Wrong Password", classes: 'rounded'});
                break;
            case "auth/user-not-found":
                M.toast({html: "No such user. Email ms18163 for an account", classes: 'rounded'});
                break;
            case "auth/invalid-email":
                M.toast({html: "Invalid email. eg: clubname@iisermohali.ac.in", classes: 'rounded'});
                break;
        }
        console.log(error.code);
        document.getElementById('signinbtn').disabled=false
    });
    return false;
}
function submiter(){
    var title = document.getElementById('title').value;
    var desc = document.getElementById('desc').value;
    var date = M.Datepicker.getInstance(document.getElementById('date')).date;
    var loc = document.getElementById('loc').value;
    var time = M.Timepicker.getInstance(document.getElementById('time')).time;
    if (title.length && desc.length && timeinmills && date && username.length && loc.length){
        if(confirm("Check all your data once again. You can't edit it after submitting. You'll have to restart if any changes are necessary!")){
            document.getElementById('title').disabled=true;
            document.getElementById('desc').disabled=true;
            document.getElementById('loc').disabled=true;
            document.getElementById('time').disabled=true;
            document.getElementById('date').disabled=true;
            document.getElementById('submit-btn').disabled=true;

            document.getElementById('header').innerHTML="Share your details";
            document.getElementById('lh').href = getLHEmail(title, loc, date.toString().slice(0,15), time, username);
            document.getElementById('wa').href = getWA(title, desc, loc, date.toString().slice(0,15), time, username);
            document.getElementById('email').href = getEmail(title, desc, loc, date.toString().slice(0,15), time, username);
            document.getElementById('app').onclick = function(){
                addData(title, desc, loc, Number(date)+timeinmills, username)
            }
            document.getElementById('finalActions').style.display = "flex";
            document.getElementById('finalActions').scrollIntoView({behavior: "smooth"});
        }
    } else {
        M.toast({html:"Check if all fields are filled", classes:"rounded"});
    }
    return false;
}
function addData(title, desc, loc, time, user){
    db.collection("events").doc(title).set({
        title: title,
        description: desc,
        location: loc,
        time:time,
        user:user
    }).then(function() {
        M.toast({html:"Event successfully added!", classes:"rounded"});
    }).catch(function(error) {
        M.toast({html:"Error writing document: "+error});
        console.error("Error writing document: ", error);
    });
}
function getLHEmail(title, loc, date, time, username){
    return "mailto:acadsec@iisermohali.ac.in?subject=Request%20for%20booking%20of%20"+loc+"%20for%20"+username+"%20event&body=Dear%20Secretary,%0A"+username+"%20requests%20you%20to%20book%20"+loc+"%20on%20"+date+"%20at%20"+time+"%20for%20the%20"+username+"%20event%20%22"+title+"%22.%20"+username+"%20would%20be%20grateful%20if%20you%20could%20do%20the%20same.%0A%0AThanks%20and%20Regards%2C%0A"+username+"";
}
function getEmail(title, desc, loc, date, time, username){
    return "mailto:students@iisermohali.ac.in?subject="+username+"%20invites%20you%20to%20attend%20%22"+title+"%22&body="+getBody(title, desc, loc, date, time, username)+"%0A%0AThanks%20and%20Regards%2C%0A"+username+"%0A%0AAutodrafted with the help of Dhruva Sambrani, Turing Club";
}
function getWA(title, desc, loc, date, time, username){
    return "https://web.whatsapp.com/send?text="+getBody(title, desc, loc, date, time, username);
}
function getBody(title, desc, loc, date, time, username){
    return "Hi%20all%2C%0A"+username+"%20is%20organising%20an%20event%20for%20you.%20Below%20are%20the%20details.%0ATitle%3A%20"+title+"%0ADescription%3A%20"+encodeURI(desc)+"%0ALocation%3A%20"+loc+"%0ADate%3A%20"+date+"%0ATime%3A%20"+time+"%0A%0AHope%20to%20see%20you%20there!";
}
