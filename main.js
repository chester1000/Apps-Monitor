function popup() {
    s = {
        url:{
            main:'http://facebook.webtop.pl/templates/tests/',
            test:'db_test.php',
            ajax:'do.php',
            for:function(i) {
                return this.main+this[i];
            }
        },
        opts: {
            level:1,    // default: 1
            sms:null,   // default: auto
            dev:null,   // default: false
            legacy:null,// default: false
            manual:null,// default: false
            days:null,  // default: 2
            params:null,// default: false
            _ret:function(){
                var r={};
                for(i in this)if(typeof this[i]!=='function'&&this[i]!==null)r[i]=this[i];
                return r;
            },
            _set:function(o){for(i in o)if(i in this)this[i]=o[i];}
        },
        get:function(callback){
            $.get(this.url.for("test"), this.opts._ret(), function(data){
                console.log(data);
                if( callback!==undefined) callback.call(this);
            }).error(function(e){
                console.log(e);
            });
        },
        _init:function(opts) {
            if(opts!==undefined) this.opts._set(opts);
        }
    }
    
    $.get(s.url.for("test"), s.opts._ret(), function(data){
        if(data.error===undefined) {
            $('#auth').submit(function(){
                $('#loader').show();
                $.post(s.url.for("ajax"),$(this).serialize(),function(data){
                    $('#loader').hide();
                    if(!data.success) $('#quickInfo').show().children('span').text(data.cause);
                    else { }
                });
                return false;
            });
        } else {
            $('#auth,#loader').remove();
            if(data.error) {
                chrome.browserAction.setIcon({path:'error.png'});
                $('#quickInfo span').addClass('error').text('Wystąpił błąd!');
            }else {
                chrome.browserAction.setIcon({path:'icon.png'});
                $('#quickInfo span').addClass('success').text('Wszystko jest OK. ');
            }

            $('#quickInfo a').text('więcej informacji').attr('href',data.url)
                .click(function(){
                    window.open($(this).attr('href'));
                });
            $('#quickInfo').show();
        }

    });
}
function settings() {
    s = {
        level:{
            val:null,
            label:[
                "Malutko",
                "Całkiem sporo",
                " + czasy wykonań"
            ],
            set:function(v){
                this.val=v;
                // TODO: save to indexed db;
            }
        },
        sms:{
            val:null,
            label:[
                "Zawsze Wyłączone",
                "Automatycznie",
                "Zawsze Włączone"
            ]
        },
        days:{
            val:null,
            label:"dni"
        },
        manual:{
            val:null,
            label:["Nie","Tak,"]
        },
        dev:{
            val:null,
            label:["Nie","Tak,"]
        },
        legacy:{
            val:null,
            label:["Nie","Tak,"]
        },
        params:{
            val:null,
            label:["Nie","Tak,"]
        },
        restoreState:function(){
            
        }
    }

    $('input[type=range]').change(function(){
        var label="",
            min=$(this).attr('min'),
            n=$(this).parent().attr('title'),
            i=s[n].val=parseInt($(this).val());

        if(typeof s[n].label==="object") do label=s[n].label[i-min]+label;while(label[1]==="+"&&--i>0);
        else label=i+s[n].label;

        $(this).siblings('label').text(label);
    }).change();

    $('input[type=checkbox]').change(function(){
        var n=$(this).attr('name'),
         i=s[n].val=parseInt($(this).filter(":checked").length);
         $(this).siblings('label').children('.curr').text(s[n].label[i]);
    }).change();
}

function prep_db() {

    var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB;
    if ('webkitIndexedDB' in window) {
        window.IDBTransaction = window.webkitIDBTransaction;
        window.IDBKeyRange = window.webkitIDBKeyRange;
    }

    db = {
        db:null,
        open:function() {
            var request = indexedDB.open("settings","All of the extension settings are stored here");

            request.onsuccess = function(e){
                var v = "1.1";
                db.db = e.target.result;
                if(v != db.db.version) {
                    var setVrequest = db.db.setVersion(v);

                    setVrequest.onfailure = db.onerror;
                    setVrequest.onsuccess = function(e) {
                        var store = db.db.createObjectStore("settings",{keyPath:"timestamp"});
                        db.getSettings();
                    };
                }
                db.getSettings();
            }
            request.onfailure = db.onerror;
        },
        addSetting:function(nanana){
            var trans = db.db.transaction(["settings"], IDBTransaction.READ_WRITE);
            var store = trans.objectStore("settings");
            var request = store.put({
                "text":nanana,
                "timestamp": new Date().getTime()
            });

            request.onsuccess = function(e) {
                db.getSettings();
            };

            request.onerror = function(e){
                console.log(e.value);
            }
        },
        getSettings:function(){
            var trans = db.db.transaction(["settings"],IDBTransaction.READ_WRITE);
            var store = trans.objectStore("settings");

            var keyRange = IDBKeyRange.lowerBound(0);
            var cursorRequest = store.openCursor(keyRange);

            cursorRequest.onsuccess = function(e) {
                var result = e.target.result;
                if(!!result==false) return;

                console.log(result.value);
                result.continue();
            }

            cursorRequest.onerror = db.onerror;
        },
        deleteSetting:function(id) {
            var trans = db.db.transaction(["settings"], IDBTransaction.READ_WRITE);
            var store = trans.objectStore("settings");

            var request = store.delete(id);

            request.onsuccess = function(e) {
                db.getSettings();
            }

            request.onerror = function(e){
                console.log(e);
            }
        },
        onerror:function(e){
            console.log(e);
        },
        _init:function(){
            db.open();
        }
    };
    window.addEventListener("DOMContentLoaded", db._init, false);
}
var db={};
$(function(){
    var s;
    prep_db();
    console.log(db);

    if( $('body#popup').length ) popup();
    else if( $('body#settings').length ) settings();
});