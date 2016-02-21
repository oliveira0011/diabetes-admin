angular.module('app.services', [])
  .service('ModalService', function ($ionicModal, $rootScope) {
    var init = function (tpl, $scope) {

      var promise;
      $scope = $scope || $rootScope.$new();

      promise = $ionicModal.fromTemplateUrl(tpl, {
        scope: $scope,
        animation: 'slide-in-up',
        backdropClickToClose: false,
        hardwareBackButtonClose: false
      }).then(function (modal) {
        $scope.modal = modal;
        $scope.$on('closeModal', function (e) {
          $scope.modal.hide();
        });
        return modal;
      });

      $scope.openModal = function () {
        $scope.modal.show();
      };
      $scope.closeModal = function () {
        $scope.modal.hide();
      };
      $scope.$on('$destroy', function () {
        $scope.modal.remove();
      });

      return promise;
    };
    var close = function () {
      $rootScope.$broadcast('closeModal');
    };
    return {
      init: init,
      close: close
    }

  })
  .service('FirebaseService', function ($rootScope) {
    var firebaseService = {};
    var deviceToken;
    var push;
    firebaseService.logoutCurrentUser = function () {
      window.localStorage.removeItem('currentUserUid');
      if (deviceToken) {
        try {
          push.unregister();
        } catch (e) {
          console.log("push notification is not present, ignored");
        }
      }
    };
    firebaseService.setCurrentUserUid = function (currentUserUid) {
      window.localStorage.setItem('currentUserUid', currentUserUid);
    };
    firebaseService.getCurrentUserUid = function () {
      return window.localStorage.getItem('currentUserUid');
    };
    firebaseService.isUserLogged = function () {
      return window.localStorage.getItem('currentUserUid') && window.localStorage.getItem('currentUserUid') !== null;
    };

    firebaseService.getDeviceToken = function () {
      console.log("GET: " + deviceToken);
      return deviceToken;
    };
    firebaseService.registerDevice = function () {
      console.log("registering device");
      var callback = function (token) {
        console.log("Device token:", token.token);
        //push.addTokenToUser(user);
        //user.save();
        deviceToken = token.token;
      };
      Ionic.io();
      push = new Ionic.Push({
        "onNotification": function (notification) {
          alert('Received push notification!');
        },
        "debug": true,
        "pluginConfig": {
          "android": {
            "iconColor": "#0000FF"
          }
        }
      });
      try {
        push.register(callback);
      } catch (e) {
        console.log("push notification is not present, ignored");
      }
      console.log("registering started for device");
    };
    firebaseService.checkDeviceToken = function () {
      if (!deviceToken) {
        firebaseService.registerDevice();
        console.log("Device token undefined");
        return;
      }
      var ref = this.getDBConnection().child('users').child(this.getCurrentUserUid()).child("deviceToken");
      ref.once('value', function (snap) {
        var storedDeviceId = snap.val();
        console.log(storedDeviceId);
        if ((!storedDeviceId || storedDeviceId == null || storedDeviceId != deviceToken)) {
          ref.set(deviceToken, function () {
            console.log("Device Token updated.");
          });
        } else {
          deviceToken = storedDeviceId;
        }
        $rootScope.$broadcast('deviceUpdated', deviceToken);
      });
    };
    firebaseService.getDBConnection = function () {
      return new Firebase("https://diabetes.firebaseio.com");
    };
    return firebaseService;
  })
  .service('UsersService', function (FirebaseService) {
    function UsersService() {
    }

    UsersService.getImage = function (user, handler) {
      var dbConnection = FirebaseService.getDBConnection();
      dbConnection.child("profileImages").child(user.id).on('value', function (snap) {
        handler(snap.val());
      });
    };
    UsersService.saveImageData = function (userId, image, user, retrievedUser, successHandler) {
      var dbConnection = FirebaseService.getDBConnection();
      /**
       * save the image if changed
       */
      if (user.profileImage.changed) {
        console.log("image changed");
        if (!retrievedUser.profileImageUid || retrievedUser.profileImageUid === '') {
          delete image.changed;
          var newImagesRef = dbConnection.child("profileImages").child(userId).set({
            image: image
          });
          successHandler();
        } else {
          dbConnection.child("profileImages").child(userId).update({
            image: image
          }, function (error) {
            if (error) {
              console.log('Image save failed');
              console.log(error);
            } else {
              console.log('Image updated');
              successHandler(userId);
            }
          });
        }
      } else {
        console.log('no need for any update on the image');
        successHandler(userId);
      }
    };
    UsersService.getUser = function (userId, handler) {
      var dbConnection = FirebaseService.getDBConnection();
      dbConnection.child("users").child(userId).once('value', function (userSnap) {
        var user = userSnap.val();
        user.id = userId;
        handler(user);
      });
    };
    UsersService.saveUser = function (uid, isNewUser, user, retrievedUser, successHandler, errorHandler) {
      var dbConnection = FirebaseService.getDBConnection();
      angular.forEach(user, function (userValue, userKey) {
        var changed = false;
        angular.forEach(retrievedUser, function (retrievedUserValue, retrievedUserKey) {
          if (!changed && retrievedUserKey === userKey) {
            retrievedUser[retrievedUserKey] = userValue.value;
            changed = true;
          }
        });
        if (!changed) {
          retrievedUser[userKey] = userValue.value;
        }
      });

      var image = retrievedUser.profileImage;
      delete  retrievedUser.profileImage;

      var usersRef = dbConnection.child("users");
      var userId = uid;
      console.log("new user? " + isNewUser);
      if (isNewUser) {
        /**
         * SAVE THE NEW USER INFO
         */
        console.log(retrievedUser);
        dbConnection.createUser({
          email: $scope.retrievedUser.email,
          password: $scope.retrievedUser.password
        }, function (error, userData) {
          console.log("aqui");
          if (error) {
            var invalidMessages;
            switch (error.code) {
              case "EMAIL_TAKEN":
                invalidMessages = ["O email introduzido já se encontra em utilização, por favor insira outro email."];
                break;
              case "INVALID_EMAIL":
                invalidMessages = ["O email introduzido não é válido. Por favor, reveja-o e submeta a informação novamente."];
                break;
              default:
                invalidMessages = ["A definição de uma palavra-passe para o utente é obrigatória"];
                console.log("Error creating user:", error);
            }
            errorHandler(invalidMessages);
          } else {
            userId = userData.uid;
            delete  retrievedUser.password;
            delete  retrievedUser.uid;
            usersRef = usersRef.child(userId).set($scope.retrievedUser);
            //userId = usersRef.key();
            console.log(userId);
            console.log("Successfully created user account with uid:", userData.uid);
            $scope.saveImageData(userId, image);
          }
        });
      } else {
        /**
         * SAVE THE CURRENT USER NEW INFO
         */
        if (user.password.value) {
          dbConnection.resetPassword({
            email: retrievedUser.email
          }, function (error, userData) {
            if (error) {
              switch (error.code) {
                case "INVALID_USER":
                  console.log("The specified user account does not exist.");
                  break;
                default:
                  console.log("Error resetting password:", error);
              }
            } else {
              console.log("Password reset email sent successfully!");
            }
          });
        }
        delete retrievedUser.password;
        usersRef.child(uid).update(retrievedUser, function () {
          console.log("user update");
        });
        UsersService.saveImageData(userId, image, user, retrievedUser, successHandler);
      }
    };
    return UsersService;
  })
  .service('BiomedicService', function (FirebaseService, Hemoglobin, BloodPressure, Cholesterol, BiomedicType, Weight) {
    function BiomedicService() {
    }

    BiomedicService.addRecord = function (biomedic, handler) {
      var dbConnection = FirebaseService.getDBConnection();
      dbConnection.child(biomedic.type).child(FirebaseService.getCurrentUserUid())
        .push({
          value: biomedic.value,
          biomedicDate: biomedic.biomedicDate.getTime()
        }, handler);
    };

    BiomedicService.getRecords = function (type, userId, handler) {
      var dbConnection = FirebaseService.getDBConnection();
      dbConnection.child(type).child(userId).on('value', function (data) {
        var results = data.val();
        for (var result in results) {
          if (results.hasOwnProperty(result)) {
            results[result].type = type;
          }
        }
        handler(type, results);
      });
    };

    BiomedicService.addHemoglobinRecord = function (biomedic, handler) {
      if (!biomedic instanceof Hemoglobin) {
        throw 'The data passed to persist must be a Hemoglobin class.';
      }
      BiomedicService.addRecord(biomedic, handler);
    };
    BiomedicService.addMinBloodPressureRecord = function (biomedic, handler) {
      if (!biomedic instanceof BloodPressure) {
        throw 'The data passed to persist must be a MinBloodPressure class.';
      }
      BiomedicService.addRecord(biomedic, handler);
    };
    BiomedicService.addMaxBloodPressureRecord = function (biomedic, handler) {
      if (!biomedic instanceof BloodPressure) {
        throw 'The data passed to persist must be a MaxBloodPressure class.';
      }
      BiomedicService.addRecord(biomedic, handler);
    };
    BiomedicService.addCholesterolRecord = function (biomedic, handler) {
      if (!biomedic instanceof Cholesterol) {
        throw 'The data passed to persist must be a Cholesterol class.';
      }
      BiomedicService.addRecord(biomedic, handler);
    };
    BiomedicService.addWeightRecord = function (biomedic, handler) {
      if (!biomedic instanceof Weight) {
        throw 'The data passed to persist must be a Weight class.';
      }
      BiomedicService.addRecord(biomedic, handler);
    };

    BiomedicService.getHemoglobinRecords = function (userId, handler) {
      BiomedicService.getRecords(BiomedicType.HEMOGLOBIN, userId, handler);
    };
    BiomedicService.getMinBloodPressureRecords = function (userId, handler) {
      BiomedicService.getRecords(BiomedicType.MIN_BLOOD_PRESSURE, userId, handler);
    };
    BiomedicService.getBloodPressureRecords = function (userId, handler) {
      BiomedicService.getRecords(BiomedicType.MIN_BLOOD_PRESSURE, userId, function (type, records) {
        BiomedicService.getRecords(BiomedicType.MAX_BLOOD_PRESSURE, userId, function (type, retrievedRecords) {
          handler(BiomedicType.BLOOD_PRESSURE, [records, retrievedRecords]);
        });
      });
    };
    BiomedicService.getMaxBloodPressureRecords = function (userId, handler) {
      BiomedicService.getRecords(BiomedicType.MAX_BLOOD_PRESSURE, userId, handler);
    };
    BiomedicService.getCholesterolRecords = function (userId, handler) {
      BiomedicService.getRecords(BiomedicType.CHOLESTEROL, userId, handler);
    };
    BiomedicService.getWeightRecords = function (userId, handler) {
      BiomedicService.getRecords(BiomedicType.WEIGHT, userId, handler);
    };
    return BiomedicService;
  })
  .service('MessageService', function ($rootScope, FirebaseService, Message, $http) {
    var messagesService = {};
    var messages = [];

    messagesService.addMessage = function (userId, message, handler) {
      if (!message instanceof Message) {
        throw 'The data passed to persist must be a Message class.';
      }
      if (!FirebaseService.isUserLogged()) {
        console.log('invalidUser');
        $rootScope.$broadcast('logoutUser');
      }
      var ref = FirebaseService.getDBConnection().child('messages').child("in").child(userId)
        .push();
      ref.set({
        title: message.title,
        body: message.body,
        date: message.date,
        type: message.type
      });
      FirebaseService.getDBConnection().child('messages').child("out").child(FirebaseService.getCurrentUserUid())
        .child(ref.key())
        .set({
          title: message.title,
          body: message.body,
          date: message.date,
          type: message.type
        }, function () {
          FirebaseService.getDBConnection().child("users").child(userId).child("deviceToken").on('value', function (snap) {
            var remoteDeviceToken = snap.val();
            if (!remoteDeviceToken || remoteDeviceToken == null) {
              return;
            }
            console.log(remoteDeviceToken);
            var d = JSON.stringify({
              "tokens": [
                remoteDeviceToken
              ],
              "notification": {
                "alert": message.title,
                "ios": {
                  "badge": 1,
                  "sound": "ping.aiff",
                  "priority": 10,
                  "contentAvailable": 1,
                  "title": "Nova Mensagem",
                  "payload": {
                    "body": message.body
                  }
                },
                "android": {
                  "collapseKey": message.title,
                  "delayWhileIdle": true,
                  "timeToLive": 300,
                  "title": "Nova Mensagem",
                  "payload": {
                    "body": message.body
                  }
                }
              }
            });
            $http({
              method: 'POST',
              url: "https://push.ionic.io/api/v1/push/",
              data: d,
              headers: {
                "Authorization": 'Basic ' + window.btoa("9838b15f3334b5c7ab4e27ddd5a370b2dcb2b2805be53fce"),
                "Content-Type": "application/json",
                "X-Ionic-Application-Id": '6cfedcfa'
              }
            }).error(function (e) {
              console.log(e);
            }).success(function (data, status) {
              console.log(data);
              console.log(status);
            });
          });
        });
    };

    messagesService.getMessages = function (handler) {
      if (!FirebaseService.isUserLogged()) {
        console.log('invalidUser');
        $rootScope.$broadcast('logoutUser');
      }
      var ref = FirebaseService.getDBConnection().child('messages').child(FirebaseService.getCurrentUserUid());
      ref.once('value', function (snap) {
        var value = snap.val();
        var retrievedNotifications = [];
        if (handler) {
          angular.forEach(value, function (notification, key) {
            notification.id = key;
            retrievedNotifications.push(notification);
          });
          messages = retrievedNotifications;
          handler(messages.slice());
        }
      });
    };
    messagesService.registerNewNotificationsListener = function () {
      if (!FirebaseService.isUserLogged()) {
        console.log('invalidUser');
        $rootScope.$broadcast('logoutUser');
      }
      var ref = FirebaseService.getDBConnection().child('messages').child(FirebaseService.getCurrentUserUid());
      ref.on('child_added', function (snap) {
        var value = snap.val();
        value.id = snap.key();
        messages.push(value);
        $rootScope.$broadcast('new_message', value);
      });
    };
    return messagesService;
  })
  .service('RecomendationService', function (FirebaseService, Recomendation, PhysicalActivity, PhysicalActivityType, MessageService, Message, MessageType) {
    var recomendationService = {};
    recomendationService.addRecomendation = function (userId, recomendation, handler) {
      if (!recomendation instanceof Recomendation) {
        throw 'The data passed to persist must be a Message class.';
      }
      if (!FirebaseService.isUserLogged()) {
        console.log('invalidUser');
        $rootScope.$broadcast('logoutUser');
      }
      var ref = FirebaseService.getDBConnection().child('recomendations').child(userId).push();
      ref.set(recomendation.toJson());
      MessageService.addMessage(userId, new Message('Recomendação atualizada', 'A atividade física recomendada pelo seu médico foi atualizada', MessageType.ACTIVITY_REEVALUATION));
    };
    recomendationService.getCurrentRecomendation = function (userId, handler) {
      if (!FirebaseService.isUserLogged()) {
        console.log('invalidUser');
        $rootScope.$broadcast('logoutUser');
      }
      FirebaseService.getDBConnection().child('recomendations').child(userId).orderByChild("date").limitToLast(1).on('value', function (snap) {
        var value = snap.val();
        for (var first in value) {
          if (value.hasOwnProperty(first)) {
            var rec = new Recomendation(value[first].exercises);
            rec.id = first;
            rec.date = value[first].date;
            handler(rec);
            return;
          }
        }
        handler();
      });
    };
    return recomendationService;
  });
