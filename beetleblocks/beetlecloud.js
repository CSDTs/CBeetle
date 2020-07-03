// Beetle Blocks cloud
// Inspired in Snap! cloud

function BeetleCloud (url) {
    this.init(url);
    this.getCSRFToken();

};

BeetleCloud.prototype.init = function (url) {
    this.url = url;
    this.checkCredentials();

    this.applicationID = 92;
    this.dataID = '';
    this.imgID = 1000;

    if(config.urls !== undefined) {
        if(config.urls.create_project_url !== undefined) {
            this.create_project_url = config.urls.create_project_url;
        }
        if(config.urls.create_file_url !== undefined) {
            this.create_file_url = config.urls.create_file_url;
        }
        if(config.urls.list_project_url !== undefined) {
            this.list_project_url = config.urls.list_project_url;
        }
        if(config.urls.login_url !== undefined) {
            this.login_url = config.urls.login_url
        }
        if(config.urls.user_detail_url !== undefined) {
            this.user_detail_url = config.urls.user_detail_url;
        }
        this.user_api_detail_url = config.urls.user_api_detail_url;
        if(config.urls.project_url_root !== undefined) {
            this.project_url_root = config.urls.project_url_root;
        }
    }

    if(config.project !== undefined){
        if(config.project.project_url !== undefined){
            this.project_url = config.project.project_url;
        }
        if(config.project.project_id !== undefined){
            this.project_id = config.project.project_id;
        }
    }

    
    
    // console.log(this.project_url);
    // this.getPublicProject(config.user, config.project.name, )


};

BeetleCloud.prototype.parseDict = Cloud.prototype.parseDict;
BeetleCloud.prototype.encodeDict = Cloud.prototype.encodeDict;

BeetleCloud.prototype.clear = function () {
    this.username = null;
};

BeetleCloud.prototype.get = function (path, callBack, errorCall, errorMsg) {
    var request = new XMLHttpRequest(),
        myself = this;
    try {
        request.open(
            'GET',
            this.url + path,
            true
        );
        request.setRequestHeader(
            'Content-Type',
            'application/json; charset=utf-8'
        );

        request.withCredentials = true;

        request.onreadystatechange = function () {
            if (request.readyState === 4) {
                if (request.responseText) {
                    var response = JSON.parse(request.responseText);
                    if (!response.error) {
                        callBack.call(null, response);
                    } else {
                        errorCall.call(
                            null,
                            response.error,
                            errorMsg
                        );
                    }
                } else {
                    errorCall.call(
                        null,
                        myself.url,
                        errorMsg
                    );
                }
            }
        };
        request.send();
    } catch (err) {
        errorCall.call(this, err.toString(), 'BeetleCloud');
    }

};

BeetleCloud.prototype.post = function (path, body, callBack, errorCall, errorMsg) {
    var request = new XMLHttpRequest(),
        myself = this;
    try {
        request.open(
            'POST',
            this.url + path,
            true
        );
        request.setRequestHeader(
            'Content-Type',
            'application/json'
        );

        request.withCredentials = true;

        request.onreadystatechange = function () {
            if (request.readyState === 4) {
                if (request.responseText) {
                    var response = JSON.parse(request.responseText);
                    if (response.error) {
                        errorCall.call(
                            this,
                            response.error,
                            'BeetleCloud'
                        );
                    } else {
                        callBack.call(
                            null,
                            response.text,
                            'BeetleCloud'
                        );
                    }
                } else {
                    errorCall.call(
                        null,
                        myself.url + path,
                        localize('could not connect to:')
                    );
                }
            }
        };
        request.send(body);
    } catch (err) {
        errorCall.call(this, err.toString(), 'BeetleCloud');
    }

};

BeetleCloud.prototype.getCurrentUser = function (callback, errorCallback) {
    this.get('/user', callback, errorCallback, 'Could not retrieve current user');
};

BeetleCloud.prototype.checkCredentials = function (callback, errorCallback) {
    var myself = this;
    this.getCurrentUser(
            function (user) {
                if (user.username) {
                    myself.username = user.username;
                }
                if (callback) { callback.call(null, user); }
            },
            errorCallback);
};

BeetleCloud.prototype.logout = function (callBack, errorCall) {
    this.get('/users/logout', callBack, errorCall, 'logout failed');
};

BeetleCloud.prototype.shareProject = function (shareOrNot, projectName, callBack, errorCall) {
    var myself = this;

    this.checkCredentials(
            function (user) {
                if (user.username) {
                    myself.get('/users/' + encodeURIComponent(user.id)
                            + '/projects/' + encodeURIComponent(projectName)
                            + '/visibility?ispublic=' + shareOrNot, // path
                            callBack, // ok callback
                            errorCall, // error callback
                            (shareOrNot ? 'S' : 'Uns') + 'haring failed'); // error message
                } else {
                    errorCall.call(this, 'You are not logged in', 'BeetleCloud');
                }
            },
            errorCall
            );
};

BeetleCloud.prototype.saveProject = function (ide, callBack, errorCall) {
    var myself = this;

    ide.stage.reRender();

        // Helper function, kindly donated by http://stackoverflow.com/questions/4998908/convert-data-uri-to-file-then-append-to-formdata
        function dataURItoBlob(dataURI, type) {
            var binary;
            if (dataURI.split(',')[0].indexOf('base64') >= 0)
                binary = atob(dataURI.split(',')[1]);
            else
                binary = unescape(dataURI.split(',')[1]);
            //var binary = atob(dataURI.split(',')[1]);
            var array = [];
            for(var i = 0; i < binary.length; i++) {
                array.push(binary.charCodeAt(i));
            }
            return new Blob([new Uint8Array(array)], {type: type});
        }

        
    this.checkCredentials(
            function (user) {
                if (user.username) {
                    var pdata = ide.serializer.serialize(ide.stage);

                    // Get the XML save file
                    var xml_string = 'data:text/xml,' + encodeURIComponent(ide.serializer.serialize(ide.stage));
                    blob = dataURItoBlob(xml_string, 'text/xml');
                    var xml = new FormData();
                    xml.append('file', blob);

                    // Get a picture of the stage
                    var image_string = ide.stage.fullImageClassic().toDataURL();
                    var blob = dataURItoBlob(image_string, 'image/png');
                    var image = new FormData();
                    image.append('file', blob);

                    // check if serialized data can be parsed back again
                    try {
                        ide.serializer.parse(pdata);
                    } catch (err) {
                        ide.showMessage('Serialization of program data failed:\n' + err);
                        throw new Error('Serialization of program data failed:\n' + err);
                    }

                    ide.showMessage('Uploading project...', 2);

                    var upload_project;
                    var completed = 0;
                    var image_id, xml_id;

                    let success1 = function(data, stuff){
                        ide.showMessage('Project Saved!', 2);
                        myself.project_id = data['id'];
                        // myself.name = data['name'];
                        myself.updateURL(/projects/+ data['id'] +'/run');
                        // callBack(data, stuff);
                    }
                    let error1 = function(xhr, error){
                        console.error(error);
                    }

                    let successImage = function(data){
                        completed++;
                        image_id = data.id;

                        if(completed === 2){
                            myself.createProject(ide.projectName, 92, xml_id, image_id,  success1, error1);
                        }
                    }

                    let successData = function(data){
                        completed++;
                        xml_id = data.id;

                        if(completed === 2){
                            myself.createProject(ide.projectName, 92, xml_id, image_id,  success1, error1);
                        }
                    }

                    let errCall = function(error){
                        console.log(error)
                    }

                    myself.saveFile(image, successImage, errCall);
                    myself.saveFile(xml, successData, errCall);


                } else {
                    errorCall.call(this, 'You are not logged in', 'BeetleCloud');
                    return;
                }
            }
    );

};

BeetleCloud.prototype.saveFile = function(file, callBack, errorCallBack) {
    $.ajax({
        type: 'PUT',
        url: '/api/files/',
        data: file,
        processData: false,
        contentType: false,
        success: callBack,
      }).fail(errorCallBack);


  };

// Backwards compatibility with old cloud, to be removed

BeetleCloud.prototype.getPublicProject = function (
    name,
    username,
    callBack,
    errorCall
) {
    // id is Username=username&projectName=projectname,
    // where the values are url-component encoded
    // callBack is a single argument function, errorCall takes two args

    // var parsedId = id.split('&').map(function(each){return each.split('=')[1]}),
        // username = decodeURIComponent(parsedId[0]),
        // projectName = decodeURIComponent(parsedId[1]);

    this.fetchProject(name, callBack, errorCall, username);
};


BeetleCloud.prototype.fetchProject = function (projectName, callBack, errorCall, publicUsername) {
    var myself = this;

    this.checkCredentials(
            function (user) {
                var username = publicUsername || user.username;
                if (!username) {
                    errorCall.call(this, 'Project could not be fetched', 'BeetleCloud');
                    return;
                } else {
                    myself.get(
                            '/users/'
                            + encodeURIComponent(username)
                            + '/projects/'
                            + encodeURIComponent(projectName),
                            function (response) { callBack.call(null, response.contents); },
                            errorCall,
                            'Could not fetch project'
                            )
                }
            },
            errorCall
            );
};

BeetleCloud.prototype.updateURL = function(URL) {
    if(window.history !== undefined && window.history.pushState !== undefined) {
        window.history.pushState({}, "", URL);
    }
};

BeetleCloud.prototype.openProject = function(project, callBack, errorCall){
    var myself = this, ide = world.children[0];
    console.log(project);



    var loadProject =
    $.get(project.project_url, null, function(data) {
      
            myself.project_id = project.id;
            myself.name = project.name;
            myself.updateURL('/projects/'+project.id+"/run");
            
            callBack(data);

    }).fail(errorCall);

}
BeetleCloud.prototype.deleteProject = function (projectName, callBack, errorCall) {
    var myself = this;

    this.checkCredentials(
            function (user) {
                if (!user.username) {
                    errorCall.call(this, 'You are not logged in', 'BeetleCloud');
                    return;
                } else {
                    myself.get(
                            '/users/'
                            + encodeURIComponent(user.id)
                            + '/projects/'
                            + encodeURIComponent(projectName)
                            + '/delete',
                            function (response) { callBack.call(null, response.text); },
                            errorCall,
                            'Could not delete project'
                            );
                }
            },
            errorCall
            );
}

BeetleCloud.prototype.getProjectList = function (callBack, errorCall) {
    var myself = this;

    this.checkCredentials(
            function (user) {
                if (!user.username) {
                    errorCall.call(this, 'You are not logged in', 'BeetleCloud');
                    return;
                } else {


                    myself.get(
                            '/projects/?owner='+user.id,
                            function (response) {
                                
                                if (Object.keys(response).length > 0) {
                                    response.forEach(eachProject => {
                                        // This looks absurd, but PostgreSQL doesn't respect case
                                        eachProject.Public = eachProject.ispublic ? 'true' : 'false'; // compatibility with old cloud
                                        eachProject.ProjectName = eachProject.projectname;
                                        eachProject.Thumbnail = eachProject.thumbnail;
                                        eachProject.Updated = eachProject.updated;
                                        eachProject.Notes = eachProject.notes;
                                    });
                                    response = response.filter(app => app.application === 92);
                                    callBack(response);
                                } else {
                                    callBack.call(null, []);
                                }
                            },
                            errorCall,
                            'Could not fetch project list'
                            );
                }
            },
            errorCall
            );
};

/** Use this to allow other API calls besides login */
BeetleCloud.prototype.getCSRFToken = function() {
    /** gets a cookie of a specific type from the page
      @param {String} name - should pretty much always be csrftoken
      @return {String} - returns the cookie
       */
    function getCookie(name) {
      let cookieValue = null;
      if (document.cookie && document.cookie != '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
          const cookie = jQuery.trim(cookies[i]);
          // Does this cookie string begin with the name we want?
          if (cookie.substring(0, name.length + 1) == (name + '=')) {
            cookieValue = decodeURIComponent(cookie.substring(
                name.length + 1));
            break;
          }
        }
      }
      return cookieValue;
    }
    const csrftoken = getCookie('csrftoken');
  
    /** tests if this is csrf safe
      @param {String} method - stests the given method
      @return {Boolean} - is safe
       */
    function csrfSafeMethod(method) {
      return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }
  
    /** test that a given url is a same-origin URL
      @param {String} url - the URL to test
      @return {Boolean} - is same origin
       */
    function sameOrigin(url) {
      const host = document.location.host; // host + port
      const protocol = document.location.protocol;
      const srOrigin = '//' + host;
      const origin = protocol + srOrigin;
      return (url == origin ||
              url.slice(0, origin.length + 1) == origin + '/') ||
              (url == srOrigin ||
               url.slice(0, srOrigin.length + 1) == srOrigin + '/') ||
              !(/^(\/\/|http:|https:).*/.test(url));
    }
  
    $.ajaxSetup({
      beforeSend: function(xhr, settings) {
        if (!csrfSafeMethod(settings.type) && sameOrigin(settings.url)) {
          xhr.setRequestHeader('X-CSRFToken', csrftoken);
        }
      },
    });
  };
  
BeetleCloud.prototype.createProject = function(projectName, appNum, dataNum, imgNum, callBack, errorBack){
   
    if(this.project_id !== undefined) {
        $.ajax({
            type: 'PUT',
            url: '/api/projects/'+this.project_id+"/",
            data: {
                name: ide.projectName,
                description: '',
                classroom: dataNum.classroom_id,
                application: appNum,
                project: dataNum,
                screenshot: imgNum
            },
            success: callBack,
            dataType: 'json'
        }).fail(errorBack);
    }else{
        $.post('/api/projects/', {
            name: projectName,
            description: '',
            classroom: '',
            application: appNum,
            project: dataNum,
            screenshot: imgNum,
          }, callBack, 'json').fail(errorBack);
    }
   


      

}


Cloud = BeetleCloud;

var SnapCloud = new BeetleCloud(
    '/api' // To be changed to HTTPS
);
