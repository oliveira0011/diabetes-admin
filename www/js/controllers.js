angular.module('app.controllers', [])
  /**
   *
   * APPLICATION CONTROLLER
   */
  .controller('AppCtrl', function ($scope, $state, FirebaseService) {
    $scope.logout = function () {
      FirebaseService.getDBConnection().unauth();
      FirebaseService.logoutCurrentUser();
      $state.go('login');
    };
    $scope.$on('logoutUser', function () {
      $scope.logout();
    });
  })
  /**
   * USERS CONTROLLERS
   */
  .controller('UsersCtrl', function ($scope, $timeout, $window, $state, UserFormFactory, FirebaseService, UsersService, $rootScope) {
    var dbConnection = FirebaseService.getDBConnection();
    dbConnection.child("doctors").child(FirebaseService.getCurrentUserUid()).child("users").once('value', function (snap) {

      $scope.users = {};
      $scope.usersIds = snap.val();
      if (!$scope.usersIds || $scope.usersIds == null) {
        return;
      }
      $scope.usersIds.forEach(function (userId) {
        UsersService.getUser(userId, function (user) {
          $scope.users[user.id] = user;
          if (!$scope.$$phase) {
            $scope.$apply();
          }
        });
      });
    });
    $scope.chooseUser = function (user) {
      $rootScope.$broadcast('userSelected', user);
    };
    $scope.loadImage = function (user) {
      return dbConnection.child("profileImages").child(user.id).on('value', function (data) {
        user.profileImage = data.val().image;
        if (!$scope.$$phase) {
          $scope.$apply();
        }
      });
    };
    //UsersService.getUsers(handler);
  })
  .controller('UserCtrl', function ($scope, UserFormFactory, FirebaseService, $stateParams, $rootScope, $ionicLoading, $ionicPopup, $state) {
    $scope.init = function () {
      if (!$scope.isNewUser) {
        $scope.options = [
          {
            description: 'Dados Pessoais',
            templateUrl: "templates/user.personal.html",
            callback: function () {
              $scope.currentOption = this;
            }
          }, {
            description: 'Atividade Física',
            templateUrl: "templates/user.biometric.html",
            callback: function () {
              $scope.currentOption = this;
            }
          }, {
            description: 'Exercícios Recomendados',
            templateUrl: "templates/user.biometric.html",
            callback: function () {
              $scope.currentOption = this;
            }
          }, {
            description: 'Dados Biométricos',
            templateUrl: "templates/user.biometric.html",
            callback: function () {
              $scope.currentOption = this;
            }
          }
        ];
        $scope.currentOption = $scope.options[$stateParams.option ? $stateParams.option : 0];
      } else {
        $scope.currentOption = {
          description: 'Dados Pessoais',
          templateUrl: "templates/user.personal.html",
          callback: function () {
            $scope.currentOption = this;
          }
        };

      }
    };
    $scope.removeUser = function () {
      var myPopup = $ionicPopup.show({
        title: 'Remover Utilizador',
        subTitle: 'Ao confirmar esta ação, o utente será removido da plataforma e não poderá mais iniciar sessão na mesma',
        scope: $scope,
        buttons: [
          {
            text: 'Cancelar',
          },
          {
            text: 'Remover',
            type: 'button-positive',
            onTap: function (e) {
              return true;
            }
          }
        ]
      });

      myPopup.then(function (res) {
        if (res) {
          $ionicLoading.show({template: "A remover utente..."});
          var dbConnection = FirebaseService.getDBConnection();
          dbConnection.child('users').child($stateParams.uid).once('value', function (snap) {
            var profileImageUid = snap.val().profileImageUid;
            if (profileImageUid) {
              dbConnection.child('profileImages').child(profileImageUid).remove(function () {
                console.log("Profile Image Removed");
              });
            }
            dbConnection.child('users').child($stateParams.uid).remove(function () {
              $ionicLoading.hide();
              $state.go('app.main');
            });
          });
        }
      });
    };
    $rootScope.$on('changeOption', function (e, data) {
      $state.go('app.useredit', {uid: data.userId, option: data.option});
    });

    if ($stateParams.uid !== undefined) {

      FirebaseService.getDBConnection().child("users").child($stateParams.uid).on('value', function (snap) {
        $scope.isNewUser = true;
        if (snap.val()) {
          $scope.isNewUser = false;
        }
        $scope.init();
      });
    } else {
      $scope.isNewUser = true;
      $scope.init();
    }
  })
  .controller('UserPersonalCtrl', function ($scope, $timeout, $window, $state, UserFormFactory, FirebaseService, $stateParams, $ionicLoading, $ionicPopup, $rootScope, UsersService) {
    if ($scope.selectedUser) {
      $stateParams.uid = $scope.selectedUser.id;//only when we are using a modal
    }

    var dbConnection = FirebaseService.getDBConnection();
    //If you want to use URL attributes before the website is loaded
    $scope.init = function () {
      $scope.isNewUser = $scope.retrievedUser === undefined;
      $scope.user = UserFormFactory.getUserStructure($scope.isNewUser);

      angular.forEach($scope.retrievedUser, function (retrievedUserValue, retrievedUserKey) {
        var changed = false;
        angular.forEach($scope.user, function (userValue, userKey) {
          if (!changed && retrievedUserKey === userKey) {
            userValue.value = retrievedUserValue;
            changed = true;
          }
        });
      });

      if (!$scope.isNewUser && $scope.retrievedUser && $scope.retrievedUser.id && $scope.retrievedUser.id !== '') {
        dbConnection.child("profileImages").child($scope.retrievedUser.id).on('value', function (data) {
          if (data.val() != null) {
            $scope.user.profileImage.value = data.val().image;
            if (!$scope.$$phase) {
              $scope.$apply();
            }
          }
        });
      }
    };
    if ($stateParams.uid !== undefined) {
      dbConnection.child('users').child($stateParams.uid).on('value', function (user) {
        $scope.retrievedUser = user.val();
        $scope.retrievedUser.id = $stateParams.uid;
        $scope.init();
      });
    } else {
      $scope.init();
      $scope.retrievedUser = {};
    }
    $scope.generatePassword = function (value) {
      value.value = Math.random().toString(36).slice(-8);
    };
    $scope.saveimage = function (e1) {
      var filename = e1[0];
      var fr = new FileReader();
      fr.onload = function (res) {
        $scope.user.profileImage.value = res.target.result;
        $scope.user.profileImage.changed = true;
        if (!$scope.$$phase) {
          $scope.$apply();
        }
      };
      fr.readAsDataURL(filename);
    };
    $scope.redirectToUsersList = function (userId) {
      $ionicLoading.hide();
      if ($scope.isNewUser) {
        var myPopup = $ionicPopup.show({
          template: "<ion-list>" +
          "<ion-item ng-repeat=\"redirectOption in redirectOptions\">" +
          "{{redirectOption.description}}" +
          "</ion-item>" +
          "</ion-list>"
          ,
          title: 'Novo Utiizador criado com sucesso',
          subTitle: 'O novo utilizador foi criado com sucesso. Pode agora escolher uma de entre as várias opções disponíveis',
          scope: $scope,
          buttons: [
            {
              text: 'Voltar à Lista de Utilizadores',
              type: 'button-positive',
              onTap: function (e) {
                $state.go('app.main');
              }
            },
            {
              text: 'Criar outro novo utilizador',
              type: 'button-positive',
              onTap: function (e) {
                $scope.init();
                $scope.retrievedUser = {};
              }
            },
            {
              text: 'Editar atividade física do utilizador',
              type: 'button-positive',
              onTap: function (e) {
                $rootScope.$broadcast('changeOption', {userId: userId, option: 1});
              }
            }
          ]
        });

        myPopup.then(function (res) {

        });
        return;
      }
      $state.go('app.main');
    };
    $scope.saveUser = function (form) {
      $scope.invalidMessages = {};
      if (form.$invalid) {
        return;
      }
      $ionicLoading.show({template: "A gravar informação..."});
      UsersService.saveUser($stateParams.uid, $scope.isNewUser, $scope.user, $scope.retrievedUser, function (userId) {
        if ($scope.selectedUser) {
          $ionicLoading.hide();
          $rootScope.$broadcast('userUpdated');
        } else {
          $scope.redirectToUsersList(userId);
        }
      }, function (invalidMessages) {
        $scope.invalidMessages = invalidMessages;
        $ionicLoading.hide();
      });
    }
  })
  .controller('MainCtrl', function ($scope, $timeout, $window, $state, ModalService, BiomedicService, BiomedicType, UsersService, RecomendationService, FirebaseService) {
    $scope.selectedUser;
    $scope.hemoglobinRecords = [];
    $scope.bloodPressureRecords = [];
    $scope.cholesterolRecords = [];
    $scope.weightRecords = [];
    $scope.currentWeek = 0;
    $scope.speeds = [
      {
        date: "31/01/2016 - 06/02/2016",
        walk: [20, 10, 0, 0, 15, 0, 0],
        run: [10, 10, 0, 0, 10, 0, 0]
      },
      {
        date: "07/02/2016 - 13/02/2016",
        walk: [10, 15, 0, 0, 15, 0, 0],
        run: [10, 10, 0, 0, 10, 0, 0]
      },
      {
        date: "14/02/2016 - 20/02/2016",
        walk: [20, 15, 0, 0, 15, 10, 15],
        run: [10, 10, 0, 0, 10, 5, 5]
      },
      {
        date: "21/02/2016 - 27/02/2016",
        walk: [20, 30, 0, 0, 15, 20, 20],
        run: [10, 10, 0, 0, 10, 5, 5]
      }
    ];

    var initSpeedGraph = function () {
      $scope.currentWeek = $scope.speeds.length - 1;
      $scope.chartSpeeds = {
        options: {
          bezierCurve: false
        },
        labels: ["S", "T", "Q", "Q", "S", "S", "D"],
        //data: [records],
        data: [$scope.speeds[$scope.currentWeek].walk, $scope.speeds[$scope.currentWeek].run],
        series: ['Correr', 'Andar'],
        colours: [{
          fillColor: "#F15854",
          strokeColor: "#B22222",
          pointColor: "#800000",
          pointStrokeColor: "#800000",
        },{
          fillColor: "#FAA43A",
          strokeColor: "#FF8C00",
          pointColor: "#FF4500",
          pointStrokeColor: "#FF4500"
        }]
      };
    };
    $scope.nextWeek = function () {
      if ($scope.currentWeek > $scope.speeds.length) {
        return;
      }
      $scope.currentWeek++;
      $scope.chartSpeeds.data = [$scope.speeds[$scope.currentWeek].walk, $scope.speeds[$scope.currentWeek].run];
    };
    $scope.previousWeek = function () {
      if ($scope.currentWeek < 1) {
        return;
      }
      $scope.currentWeek--;
      $scope.chartSpeeds.data = [$scope.speeds[$scope.currentWeek].walk, $scope.speeds[$scope.currentWeek].run];
    };


    function getFormattedDate(timestamp) {
      var date = new Date(timestamp);
      var month = date.getMonth() + 1;
      month = month < 10 ? '0' + month : month;
      var year = date.getFullYear();
      return month + '-' + year;
    }

    var handler = function (type, retrievedRecords) {

      if (!retrievedRecords || retrievedRecords == null) {
        return;
      }
      var arr = Object.keys(retrievedRecords).map(function (k) {
        return retrievedRecords[k]
      });
      if (arr.length == 0) {
        return;
      }
      var records = [];
      var colors = {};
      var labels = [];
      switch (type) {
        case BiomedicType.HEMOGLOBIN:
          colors = {
            fillColor: "#F15854",
            strokeColor: "#B22222",
            pointColor: "#800000",
            pointStrokeColor: "#800000",
          };
          records = $scope.hemoglobinRecords;
          break;
        case BiomedicType.BLOOD_PRESSURE:

          if (retrievedRecords.length != 2 || !retrievedRecords[0] || retrievedRecords[0] == null || !retrievedRecords[1] || retrievedRecords[1] == null) {
            return;
          }
          records = [[], []];
          labels = [];
          var minRecords = Object.keys(retrievedRecords[0]).map(function (k) {
            return retrievedRecords[0][k]
          });
          var maxRecords = Object.keys(retrievedRecords[1]).map(function (k) {
            return retrievedRecords[1][k]
          });

          var rec = minRecords.concat(maxRecords);
          rec.sort(function (a, b) {
            return parseFloat(a.biomedicDate) - parseFloat(b.biomedicDate);
          });

          var cMax = 0;
          var cMin = 0;
          for (var i = 0; i < rec.length; i++) {
            var record = rec[i];
            var isNew = true;
            var date = getFormattedDate(record.biomedicDate);
            var nextRecord;
            var nextDate;
            if (labels.indexOf(date) == -1) {
              if (record.type == BiomedicType.MIN_BLOOD_PRESSURE) {
                nextRecord = rec[cMin + 1];
              } else if (record.type == BiomedicType.MAX_BLOOD_PRESSURE) {
                nextRecord = rec[cMax + 1];
              }
              labels.push(date);
              if (nextRecord) {
                nextDate = getFormattedDate(nextRecord.biomedicDate);
                if (nextDate == date) {
                  isNew = false;
                  if (nextRecord.type == BiomedicType.MIN_BLOOD_PRESSURE) {
                    records[1].push(nextRecord.value);
                    i++;
                  } else if (nextRecord.type == BiomedicType.MAX_BLOOD_PRESSURE) {
                    records[0].push(nextRecord.value);
                    i++;
                  }
                  cMin++;
                  cMax++;
                } else {
                  nextRecord = undefined;
                  if (record.type == BiomedicType.MIN_BLOOD_PRESSURE) {
                    records[0].push(0);
                    cMin++;
                  } else if (record.type == BiomedicType.MAX_BLOOD_PRESSURE) {
                    records[1].push(0);
                    cMax++;
                  }
                }
              }
            }
            cMin++;
            cMax++;


            if (record.type == BiomedicType.MIN_BLOOD_PRESSURE) {
              records[1].push(record.value);
            } else if (record.type == BiomedicType.MAX_BLOOD_PRESSURE) {
              records[0].push(record.value);
            }
          }
          colors = {
            fillColor: "#FAA43A",
            strokeColor: "#FF8C00",
            pointColor: "#FF4500",
            pointStrokeColor: "#FF4500"
          };
          break;
        case BiomedicType.CHOLESTEROL:
          colors = {
            fillColor: "#F17CB0",
            strokeColor: "#F08080",
            pointColor: "#CD5C5C",
            pointStrokeColor: "#CD5C5C"
          };
          records = $scope.cholesterolRecords;
          break;
        case BiomedicType.WEIGHT:
          colors = {
            fillColor: "#F17CB0",
            strokeColor: "#F08080",
            pointColor: "#CD5C5C",
            pointStrokeColor: "#CD5C5C"
          };
          records = $scope.weightRecords;
          break;
      }
      if (records.length == 0) {


        arr.sort(function (a, b) {
          return parseFloat(a.biomedicDate) - parseFloat(b.biomedicDate);
        });
        angular.forEach(arr, function (record) {
          records.push(record.value);
          labels.push(getFormattedDate(record.biomedicDate));
        });

      }
      switch (type) {
        case BiomedicType.HEMOGLOBIN:
          $scope.chartHemoglobin = {
            options: {
              bezierCurve: false
            },
            labels: labels,
            data: [records],
            series: ['Hemoglobina'],
            colours: [colors]
          };
          break;
        case BiomedicType.BLOOD_PRESSURE:
          $scope.chartBloodPressure = {
            options: {
              bezierCurve: false
            },
            labels: labels,
            data: records,
            series: ['Tensão Arterial Máxima', 'Tensão Arterial Mínima'],
            colours: [colors]
          };
          break;
        case BiomedicType.CHOLESTEROL:
          $scope.chartCholesterol = {
            options: {
              bezierCurve: false
            },
            labels: labels.splice(0, 3),
            data: [records.splice(0, 3)],
            series: ['Colesterol'],
            colours: [colors]
          };
          break;
        case BiomedicType.WEIGHT:
          var imc = [];
          var merged = [];
          for (var i = 0; i < records.length; i++) {//IMC calculation
            imc[i] = (records[i] / (1.71 * 1.71)).toFixed(2);
            merged[i] = {weight: records[i], imc: imc[i]};
          }
          $scope.chartWeight = {
            options: {
              bezierCurve: false
            },
            labels: labels,
            data: merged,
            //data: [records, imc],
            series: ['Peso', 'IMC'],
            colours: [colors]
          };
          break;
      }
      if (!$scope.$$phase) {
        $scope.$apply();
      }
    };
    $scope.openNotificationModal = function () {
      ModalService
        .init('templates/notification-new-modal.html', $scope)
        .then(function (modal) {
          modal.show();
        });
    };
    $scope.openPhysicalActivityModal = function () {
      ModalService
        .init('templates/physical-activity-recomendation-new-modal.html', $scope)
        .then(function (modal) {
          modal.show();
        });
    };
    $scope.openViewPhysicalActivityModal = function () {
      ModalService
        .init('templates/physical-activity-recomendation-view-modal.html', $scope)
        .then(function (modal) {
          modal.show();
        });
    };

    $scope.getUserFormattedDate = function (timestamp) {
      var currentYear = new Date().getFullYear();
      var currentMonth = new Date().getMonth() + 1;
      var date = new Date(timestamp);
      var day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
      var month = date.getMonth() + 1;
      month = month < 10 ? '0' + month : month;
      var year = date.getFullYear();
      return day + "/" + month + '/' + year + ' (' + (currentYear - year - (currentMonth < month ? 1 : 0)) + ' anos)';
    };
    $scope.getFormattedDate = function (timestamp) {
      var date = new Date(timestamp);
      var day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
      var month = date.getMonth() + 1;
      var hours = date.getHours();
      var minutes = date.getMinutes();
      var seconds = date.getSeconds();
      month = month < 10 ? '0' + month : month;
      hours = hours < 10 ? '0' + hours : hours;
      minutes = minutes < 10 ? '0' + minutes : minutes;
      seconds = seconds < 10 ? '0' + seconds : seconds;
      var year = date.getFullYear();
      return day + "/" + month + '/' + year + " " + hours + ":" + minutes + ":" + seconds;
    };
    var defaultChart = {
      labels: [''],
      data: [],
      series: ['']
    };
    $scope.selectUser = function () {
      ModalService
        .init('templates/users-modal.html', null)
        .then(function (modal) {
          modal.show();
        });
      $scope.$on('userSelected', function (e, user) {
        $scope.selectedUser = user;
        $scope.selectedUser.formattedBirthdate = $scope.getUserFormattedDate($scope.selectedUser.birthdate);

        $scope.hemoglobinRecords = [];
        $scope.bloodPressureRecords = [];
        $scope.cholesterolRecords = [];
        $scope.weightRecords = [];
        initSpeedGraph();

        if ($scope.chartHemoglobin) {
          $scope.chartHemoglobin = defaultChart;
        }
        if ($scope.chartBloodPressure) {
          $scope.chartBloodPressure = defaultChart;
        }
        if ($scope.chartCholesterol) {
          $scope.chartCholesterol = defaultChart;
        }
        if ($scope.chartWeight) {
          $scope.chartWeight = defaultChart;
        }

        ModalService.close();
        BiomedicService.getHemoglobinRecords(user.id, handler);
        BiomedicService.getBloodPressureRecords(user.id, handler);
        BiomedicService.getCholesterolRecords(user.id, handler);
        BiomedicService.getWeightRecords(user.id, handler);

        UsersService.getImage($scope.selectedUser, function (data) {
          user.profileImage = data.image;
          if (!$scope.$$phase) {
            $scope.$apply();
          }
        });


        RecomendationService.getCurrentRecomendation($scope.selectedUser.id, function (recomendation) {
          if (recomendation) {
            $scope.currentRecomendation = recomendation.toJson();
          }
        });

      })
    };
    if (!$scope.selectedUser) {
      $scope.selectUser();
    }

    $scope.editUserPersonalData = function () {

      ModalService
        .init('templates/user-personal-modal.html', $scope)
        .then(function (modal) {
          modal.show();
        });
    };

    $scope.closeModal = function () {
      ModalService.close();
    };

    $scope.$on('userUpdated', function () {
      UsersService.getUser($scope.selectedUser.id, function (user) {
        ModalService.close();
        $scope.$broadcast('userSelected', user);

      })
    });
  })
  .controller('LoginCtrl', function ($scope, $state, $stateParams, FirebaseService, $ionicPopup, $ionicLoading) {
    if (FirebaseService.isUserLogged()) {
      FirebaseService.checkDeviceToken();
      $state.go('app.main');
    }
    $scope.loginData = {
      username: 'm1@hotmail.com',
      password: 'xptoxpto'
    };
    $scope.doLogin = function (form) {
      delete $scope.errorMessage;
      if (form.$valid) {
        $ionicLoading.show({template: 'A autenticar...'});
        var dbConnection = FirebaseService.getDBConnection();

        function authHandler(error, authData) {
          if (error) {
            console.log("Login Failed!", error);
          } else {
            console.log("Authenticated successfully with payload:", authData);
            FirebaseService.setCurrentUserUid(authData.uid);
            if (authData.password.isTemporaryPassword) {
              $ionicLoading.hide();
              var tempPass = $scope.loginData.password;
              $scope.data = {};
              var myPopup = $ionicPopup.show({
                template: '<input type="password" ng-model="data.newPassword">',
                title: 'Nova Palavra-Passe',
                subTitle: 'A palavra-passe introduzida, apesar de válida, é uma palavra-passe temporária, por favor introduza uma nova palavra passe. Esta passará a ser a sua palavra-chave de autenticação na plataforma',
                scope: $scope,
                buttons: [
                  {text: 'Cancelar'},
                  {
                    text: '<b>Gravar</b>',
                    type: 'button-positive',
                    onTap: function (e) {
                      if (!$scope.data.newPassword) {
                        e.preventDefault();
                      } else {
                        return $scope.data.newPassword;
                      }
                    }
                  }
                ]
              });

              myPopup.then(function (res) {
                delete $scope.data;
                dbConnection.changePassword({
                  email: $scope.loginData.username,
                  newPassword: res,
                  oldPassword: tempPass
                }, function (error) {
                  if (error) {
                    switch (error.code) {
                      case "INVALID_PASSWORD":
                        console.log("The specified user account password is incorrect.");
                        break;
                      case "INVALID_USER":
                        console.log("The specified user account does not exist.");
                        break;
                      default:
                        console.log("Error changing password:", error);
                    }
                  } else {
                    console.log("User password changed successfully!");

                    dbConnection.authWithPassword({
                      email: $scope.loginData.username,
                      password: res
                    }, authHandler);

                  }
                });
              });
              return;
            }
            FirebaseService.checkDeviceToken();
            $state.go('app.main');
            $scope.loginData = {};
            form.$setPristine(false);
          }
          $ionicLoading.hide();
        }

        dbConnection.authWithPassword({
          email: $scope.loginData.username,
          password: $scope.loginData.password
        }, authHandler);

      }
      return false;
      //if($scope.loginData.username.trim().length == 0){
      //
      //}
    };

    $scope.resetPassword = function () {
      $scope.data = {};
      var myPopup = $ionicPopup.show({
        template: '<input type="email" ng-model="data.email">',
        title: 'Recuperar Palavra-Passe',
        subTitle: 'Introduza o seu email de acesso à plataforma. Ser-lhe-à enviado um email com uma palavra-passe temporária.',
        scope: $scope,
        buttons: [
          {text: 'Cancelar'},
          {
            text: '<b>Gravar</b>',
            type: 'button-positive',
            onTap: function (e) {
              if (!$scope.data.email) {
                e.preventDefault();
              } else {
                return $scope.data.email;
              }
            }
          }
        ]
      });

      myPopup.then(function (res) {
        $ionicLoading.show({
          template: "A enviar email de reposição de palavra-passe..."
        });
        FirebaseService.getDBConnection().resetPassword({
          email: res
        }, function (error) {
          if (error === null) {
            console.log("Password reset email sent successfully");
            $scope.infoMessages = ["Email de recuperação de palavra-passe enviado com sucesso"];
          } else {
            console.log("Error sending password reset email:", error);
            $scope.errorMessages =
              ["Lamentamos mas não foi possível enviar o email de recuperação de palavra-passe.",
                "Por favor, verifique se o email introduzido é válido e/ou tente mais tarde."];
            $scope.$apply();
          }
          delete $scope.data;
          $ionicLoading.hide();
        });
      });
    };
  })
  .controller('MessageCtrl', function ($scope, $ionicLoading, ModalService, MessageService, Message, MessageType) {
    $scope.message = {};
    $scope.closeModal = function () {
      ModalService.close();
    };
    $scope.sendMessage = function (form) {
      if (form.$invalid) {
        return;
      }
      $ionicLoading.show({template: "A enviar Mensagem ..."});
      var handler = function () {
        $ionicLoading.hide();
        ModalService.close();
      };
      MessageService.addMessage($scope.selectedUser.id, new Message($scope.message.title, $scope.message.body, MessageType.CUSTOM), handler());
    }
  })
  .controller('PhysicalActivityCtrl', function ($scope, $ionicLoading, ModalService, RecomendationService, Recomendation, PhysicalActivityType) {


    RecomendationService.getCurrentRecomendation($scope.selectedUser.id, function (recomendation) {
      if (recomendation && recomendation !== null) {
        $scope.recomendation = recomendation.toJson();
      } else {
        $scope.recomendation = {
          exercises: [{
            duration: 15,
            frequency: 2,
            type: PhysicalActivityType.WALK
          }]
        };
      }
    });
    $scope.recomendationsTypes = Object.keys(PhysicalActivityType).map(function (key) {
      return PhysicalActivityType[key]
    });

    $scope.getAvailableRecomendationsTypes = function (index, type) {
      var optionsToReturn = $scope.recomendationsTypes.slice(0);
      for (var i = 0; i < $scope.recomendation.exercises.length; i++) {
        var obj = $scope.recomendation.exercises[i];
        if (obj.type !== type) {
          var idx = -1;
          for (var j = 0; j < optionsToReturn.length; j++) {
            var obj1 = optionsToReturn[j];
            if (obj && obj.type && obj1.key === obj.type.key) {
              idx = j;
              break;
            }
          }
          if (idx !== -1) {
            optionsToReturn.splice(idx, 1);
          }
        }
      }
      if (!$scope.recomendation.exercises[index].type) {
        $scope.recomendation.exercises[index].type = optionsToReturn[0];
      }
      return optionsToReturn;
    };
    $scope.addExercise = function (index) {
      $scope.recomendation.exercises.splice(index + 1, 0, {
        duration: 15,
        frequency: 2
      });
    };
    $scope.removeExercise = function (index) {
      $scope.recomendation.exercises.splice(index, 1);
    };


    $scope.closeModal = function () {
      ModalService.close();
    };
    $scope.sendMessage = function (form) {
      if (form.$invalid) {
        return;
      }
      $ionicLoading.show({template: "A Gravar Recomendação ..."});
      var handler = function () {
        $ionicLoading.hide();
        ModalService.close();
      };
      RecomendationService.addRecomendation($scope.selectedUser.id, new Recomendation($scope.recomendation.exercises), handler());
    };
  })
  .controller('PhysicalActivityViewCtrl', function ($scope, $ionicLoading, ModalService, RecomendationService, Recomendation, PhysicalActivityType) {

    $scope.currentIndex = 0;

    $scope.getFormattedDate = function (timestamp) {
      var date = new Date(timestamp);
      var day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
      var month = date.getMonth() + 1;
      var hours = date.getHours();
      var minutes = date.getMinutes();
      var seconds = date.getSeconds();
      month = month < 10 ? '0' + month : month;
      hours = hours < 10 ? '0' + hours : hours;
      minutes = minutes < 10 ? '0' + minutes : minutes;
      seconds = seconds < 10 ? '0' + seconds : seconds;
      var year = date.getFullYear();
      return day + "/" + month + '/' + year + " " + hours + ":" + minutes + ":" + seconds;
    };
    $scope.recomendations = [];
    $scope.recomendation = {};

    RecomendationService.getRecomendations($scope.selectedUser.id, function (recomendations) {
      if (recomendations && recomendations !== null) {
        for (var i = 0; i < recomendations.length; i++) {
          var obj = recomendations[i];
          $scope.recomendations.push(obj.toJson());
        }
        $scope.currentIndex = $scope.recomendations.length-2;
        $scope.recomendation = $scope.recomendations[$scope.currentIndex];
      }
    });

    $scope.nextRecomendation = function () {

      if ($scope.currentIndex == $scope.recomendations.length - 1) {
        return;
      }
      $scope.recomendation = $scope.recomendations[$scope.currentIndex++];

    };
    $scope.previousRecomendation = function () {

      if ($scope.currentIndex == 0) {
        return;
      }
      $scope.recomendation = $scope.recomendations[$scope.currentIndex--];
    };
    $scope.closeModal = function () {
      ModalService.close();
    };

  })
  .controller('PlaylistCtrl', function ($scope, $stateParams) {
  });
