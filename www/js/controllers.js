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
  .controller('MainCtrl', function ($scope, $timeout, $window, $state, ModalService, BiomedicService, BiomedicType, UsersService, RecomendationService, FirebaseService, PhysicalActivityType) {
    $scope.getFormattedDateSpeed = function (timestamp) {
      var date = new Date(timestamp);
      var day = date.getDate();
      var month = date.getMonth() + 1;
      month = month < 10 ? '0' + month : month;
      day = day < 10 ? '0' + day : day;
      var year = date.getFullYear();
      return day + "-" + month + '-' + year;
    };

    var initChart = function (caption, subcaption, colors) {
      return {
        attrs: {
          caption: caption,
          subcaption: subcaption,
          bgcolor: "FFFFFF",
          animation: "0",
          showalternatehgridcolor: "0",
          divlinecolor: 'CCCCCC',
          showvalues: "0",
          showcanvasborder: "0",
          legendshadow: "0",
          showborder: "0",
          paletteColors: colors,
          dynamicaxis: "1",
          scrollheight: "10"
        },
        //labels: labels,
        dataset: [{
          "seriesname": "",
          "data": []
        }],
        categories: [{
          category: []
        }],
        colors: colors
      }
    };

    $scope.hemoglobinRecords = [];
    $scope.bloodPressureRecords = [];
    $scope.cholesterolRecords = [];
    $scope.weightRecords = [];
    $scope.currentWeek = new Date().getTime();
    $scope.currentWeekFormatted = $scope.getFormattedDateSpeed($scope.currentWeek - 519000000) + " - " + $scope.getFormattedDateSpeed($scope.currentWeek);

    $scope.chartCholesterol = initChart('', '', "#DECF3F");
    $scope.chartWeight = initChart('', '', "#B276B2, #F17CB0");
    $scope.chartHemoglobin = initChart('', '', "#F15854");
    $scope.chartBloodPressure = initChart('', '', "#4D4D4D, #5DA5DA");
    $scope.chartSpeeds = initChart('', '', "#F15854, #FAA43A");

    $scope.chartSpeeds.categories = [{
      category: []
    }, {
      category: []
    }, {
      category: []
    }, {
      category: []
    }, {
      category: []
    }, {
      category: []
    }, {
      category: []
    }];

    $scope.chartSpeeds.dataset = [{
      "seriesName": "Idle",
      "data": [{}, {}, {}, {}, {}, {}, {}]
    }, {
      "seriesName": "Andar",
      "data": [{}, {}, {}, {}, {}, {}, {}]
    }, {
      "seriesName": "Correr",
      "data": [{}, {}, {}, {}, {}, {}, {}]
    }];

    $scope.chartSpeeds.trendlines = [
      {
        "line": [
          {
            "startvalue": "0",
            "color": "#0075c2",
            "displayvalue": "Caminhada",
            "valueOnRight": "1",
            "thickness": "1",
            "showBelow": "1",
          },
          {
            "startvalue": "0",
            "color": "#1aaf5d",
            "displayvalue": "Corrida",
            "valueOnRight": "1",
            "thickness": "1",
            "showBelow": "1",
          }
        ]
      }
    ];

    var fillSerie = function (serieNumber, date) {
      //serieNumber = 6 - serieNumber;
      var formattedDate = $scope.getFormattedDateSpeed(date - (86400000 * serieNumber));
      $scope.chartSpeeds.categories[0].category[serieNumber] = {label: formattedDate};
      FirebaseService.getDBConnection().child('physical_activity').child($scope.selectedUser.id).child(formattedDate)
        .once('value', function (snap) {
          $scope.chartSpeeds.dataset[0].data[serieNumber] = {};
          $scope.chartSpeeds.dataset[1].data[serieNumber] = {};
          $scope.chartSpeeds.dataset[2].data[serieNumber] = {};
          var items = snap.val();
          if (items == null) {
            items = {
              idle: 0,
              walk: 0,
              run: 0
            }
          }
          if (items == null) {
            items = {
              idle: 0,
              walk: 0,
              run: 0
            }
          }
          //$scope.chartSpeeds.dataset[0].data[serieNumber] = ({label: 'Idle', value: items.idle});
          $scope.chartSpeeds.dataset[1].data[serieNumber] = ({label: 'Andar', value: items.walk/60});
          $scope.chartSpeeds.dataset[2].data[serieNumber] = ({label: 'Correr', value: items.run/60});
          if(!$scope.$$phase){
            $scope.$apply();
          }
        });

    };

    $scope.nextWeek = function () {
      $scope.currentWeek += 604800000;
      $scope.currentWeekFormatted = $scope.getFormattedDateSpeed($scope.currentWeek - 519000000) + " - " + $scope.getFormattedDateSpeed($scope.currentWeek);
      for (var i = 0; i < 7; i++) {
        fillSerie(i, new Date($scope.currentWeek));//week millis
      }
    };
    $scope.previousWeek = function () {
      $scope.currentWeek -= 604800000;
      $scope.currentWeekFormatted = $scope.getFormattedDateSpeed($scope.currentWeek - 519000000) + " - " + $scope.getFormattedDateSpeed($scope.currentWeek);
      for (var i = 0; i < 7; i++) {
        fillSerie(i, new Date($scope.currentWeek));//week millis
      }
    };


    function getFormattedDate(timestamp) {
      var date = new Date(timestamp);
      var month = date.getMonth() + 1;
      month = month < 10 ? '0' + month : month;
      var year = date.getFullYear();
      return month + '-' + year;
    }


    var handler = function (type, retrievedRecords) {
      if (!retrievedRecords) {
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
      var labels = [{
        category: []
      }];
      switch (type) {
        case BiomedicType.HEMOGLOBIN:
          colors = $scope.chartHemoglobin.colors;
          records = [{
            "seriesname": "Hemoglobina",
            "data": $scope.hemoglobinRecords
          }];
          break;
        case BiomedicType.BLOOD_PRESSURE:
          colors = $scope.chartBloodPressure.colors;
          records = [{
            "seriesname": "Tensão Arterial Máxima",
            "data": []
          }, {
            "seriesname": "Tensão Arterial Mínima",
            "data": []
          }];
          if (!retrievedRecords[0] || !retrievedRecords[1]) {
            return;
          }
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
            if (labels[0].category.indexOf(date) == -1) {
              if (record.type == BiomedicType.MIN_BLOOD_PRESSURE) {
                nextRecord = rec[cMin + 1];
              } else if (record.type == BiomedicType.MAX_BLOOD_PRESSURE) {
                nextRecord = rec[cMax + 1];
              }
              labels[0].category.push({label: date});
              if (nextRecord) {
                nextDate = getFormattedDate(nextRecord.biomedicDate);
                if (nextDate == date) {
                  isNew = false;
                  if (nextRecord.type == BiomedicType.MIN_BLOOD_PRESSURE) {
                    records[1].data.push({value: nextRecord.value});
                    i++;
                  } else if (nextRecord.type == BiomedicType.MAX_BLOOD_PRESSURE) {
                    records[0].data.push({value: nextRecord.value});
                    i++;
                  }
                  cMin++;
                  cMax++;
                } else {
                  nextRecord = undefined;
                  if (record.type == BiomedicType.MIN_BLOOD_PRESSURE) {
                    records[0].data.push({value: 0});
                    cMin++;
                  } else if (record.type == BiomedicType.MAX_BLOOD_PRESSURE) {
                    records[1].data.push({value: 0});
                    cMax++;
                  }
                }
              }
            }
            cMin++;
            cMax++;


            if (record.type == BiomedicType.MIN_BLOOD_PRESSURE) {
              records[1].data.push({value: record.value});
            } else if (record.type == BiomedicType.MAX_BLOOD_PRESSURE) {
              records[0].data.push({value: record.value});
            }
          }
          break;
        case BiomedicType.CHOLESTEROL:
          colors = $scope.chartCholesterol.colors;
          records = [{
            "seriesname": "Colesterol",
            "data": $scope.cholesterolRecords
          }];
          break;
        case BiomedicType.WEIGHT:
          colors = {
            fillColor: "#F17CB0",
            strokeColor: "#F08080",
            pointColor: "#CD5C5C",
            pointStrokeColor: "#CD5C5C"
          };
          records = $scope.weightRecords;
          if (records.length == 0) {
            labels = [];
            arr.sort(function (a, b) {
              return parseFloat(a.biomedicDate) - parseFloat(b.biomedicDate);
            });
            angular.forEach(arr, function (record) {
              records.push(record.value);
              labels.push(getFormattedDate(record.biomedicDate));
            });
          }
          var imc = [];
          var merged = [];
          for (var i = 0; i < records.length; i++) {//IMC calculation
            imc[i] = (records[i] / (1.71 * 1.71)).toFixed(2);
            merged[i] = {weight: records[i], imc: imc[i]};
          }
          $scope.chartWeight = {
            labels: labels,
            data: merged,
            //data: [records, imc],
            series: ['Peso', 'IMC'],
            colours: [colors]
          };
          return;
      }
      if (records[0].data.length == 0) {
        arr.sort(function (a, b) {
          return parseFloat(a.biomedicDate) - parseFloat(b.biomedicDate);
        });
        angular.forEach(arr, function (record) {
          records[0].data.push({value: record.value});
          labels[0].category.push({label: getFormattedDate(record.biomedicDate)});
        });
      }
      switch (type) {
        case BiomedicType.HEMOGLOBIN:
          $scope.chartHemoglobin.dataset = records;
          $scope.chartHemoglobin.categories = labels;
          break;
        case BiomedicType.BLOOD_PRESSURE:
          $scope.chartBloodPressure.dataset = records;
          $scope.chartBloodPressure.categories = labels;
          break;
        case BiomedicType.CHOLESTEROL:
          $scope.chartCholesterol.dataset = records;
          $scope.chartCholesterol.categories = labels;
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
    $scope.selectUser = function () {
      ModalService
        .init('templates/users-modal.html', null)
        .then(function (modal) {
          modal.show();
        });
      $scope.$on('userSelected', function (e, user) {
        $scope.physicalActivity = {
          classPercentage: '0',
          labelPercentage: '',
          classWeeks: '',
          labelWeeks: '0 / 0'
        };
        $scope.physicalActivityWeeks = 0;
        $scope.physicalActivityPercentage = 0;
        $scope.physicalActivityTotalWeeks = 0;

        $scope.selectedUser = user;
        $scope.selectedUser.formattedBirthdate = $scope.getUserFormattedDate($scope.selectedUser.birthdate);

        $scope.hemoglobinRecords = [];
        $scope.bloodPressureRecords = [];
        $scope.cholesterolRecords = [];
        $scope.weightRecords = [];

        $scope.currentWeek = new Date().getTime();
        $scope.currentWeekFormatted = $scope.getFormattedDateSpeed($scope.currentWeek - 519000000) + " - " + $scope.getFormattedDateSpeed($scope.currentWeek);

        if ($scope.chartWeight) {
          $scope.chartWeight = {
            labels: [''],
            data: [],
            series: ['']
          };
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
        $scope.calculatePhysicalActivityStats = function (recomendation) {
          var startDate = $scope.getFormattedDateSpeed(recomendation.date);
          var dateDate = new Date(recomendation.date);
          var maxDate = new Date();

          var auxDay = 0;
          var auxWeek = 0;
          var dates = [];
          dates[0] = {
            startDate: recomendation.date,
            endDate: dateDate.setDate(dateDate.getDate() + 1),
            days: []
          };
          dates[0].days[0] = {date: recomendation.date, formattedDate: startDate};
          var nextDate = new Date(recomendation.date);
          while (nextDate.getTime() < maxDate.getTime()) {
            if (!dates[auxWeek]) {
              dateDate = new Date(nextDate.getTime());
              dates[auxWeek] = {
                startDate: nextDate.getTime(),
                formattedStartDate: $scope.getFormattedDateSpeed(nextDate.getTime()),
                endDate: dateDate.setDate(dateDate.getDate() + 7),
                formattedEndDate: $scope.getFormattedDateSpeed(dateDate.getTime()),
                days: []
              };
            }
            nextDate.setDate(nextDate.getDate() + 1);
            var formattedDate = $scope.getFormattedDateSpeed(nextDate.getTime());
            if (++auxDay == 7) {
              auxWeek++;
              auxDay = 0;
              continue;
            }
            dates[auxWeek].days[auxDay] = {date: recomendation.date, formattedDate: formattedDate};
          }
          $scope.physicalActivityTotalWeeks = dates.length;
          for (var i = 0; i < dates.length; i++) {
            var obj = dates[i];
            FirebaseService.getDBConnection().child('physical_activity').child($scope.selectedUser.id)
              .startAt(obj.formattedStartDate)
              .endAt(obj.formattedEndDate)
              .once('value', function (snap) {

                var physicalActivityTotalSeconds = 0;
                var frequencies = {};
                for (var j = 0; j < recomendation.exercises.length; j++) {
                  var obj1 = recomendation.exercises[j];
                  frequencies[obj1.type.key] = {
                    duration: obj1.duration,
                    durationPerformed: 0,
                    frequency: obj1.frequency,
                    frequencyPerformed: 0
                  };
                  physicalActivityTotalSeconds += obj1.duration * obj1.frequency;
                }


                var items = snap.val();
                if (!items || items == null) {
                  return;
                }

                var itemsArray = Object.keys(items).map(function (key) {
                  return items[key]
                });

                var physicalSecondsAux = 0;
                for (var x = 0; x < itemsArray.length; x++) {
                  var obj2 = itemsArray[x];
                  if (obj2 != null) {
                    if (frequencies[PhysicalActivityType.WALK.key]) {
                      frequencies[PhysicalActivityType.WALK.key].durationPerformed += (!obj2.walk ? 0 : obj2.walk);
                      physicalSecondsAux += (!obj2.walk ? 0 : obj2.walk);
                      if (obj2.walk && obj2.walk >= frequencies[PhysicalActivityType.WALK.key].duration) {
                        frequencies[PhysicalActivityType.WALK.key].frequencyPerformed++;
                      }
                    }
                    if (frequencies[PhysicalActivityType.RUN.key]) {
                      frequencies[PhysicalActivityType.RUN.key].durationPerformed += (!obj2.run ? 0 : obj2.run);
                      physicalSecondsAux += (!obj2.run ? 0 : obj2.run);
                      if (obj2.run && obj2.run >= frequencies[PhysicalActivityType.RUN.key].duration) {
                        frequencies[PhysicalActivityType.RUN.key].frequencyPerformed++;
                      }
                    }
                  }
                }

                var frequenciesArray = Object.keys(frequencies).map(function (key) {
                  return frequencies[key]
                });

                var addValidWeek = true;
                for (var c = 0; c < frequenciesArray.length; c++) {
                  var obj3 = frequenciesArray[c];
                  if (obj3 && obj3.frequency !== obj3.frequencyPerformed) {
                    //addValidWeek = false;
                    break;
                  }
                }
                if (addValidWeek) {
                  $scope.physicalActivityWeeks++;
                }
                $scope.physicalActivityPercentage = physicalSecondsAux * 100 / physicalActivityTotalSeconds;

                $scope.physicalActivity = {
                  classPercentage: $scope.physicalActivityPercentage < 75 ? 'circle-red' : $scope.physicalActivityPercentage < 100 ? 'circle-orange' : 'circle-green',
                  labelPercentage: $scope.physicalActivityPercentage > 100 ? '> 100%' : $scope.physicalActivityPercentage + '%',
                  classWeeks: $scope.physicalActivityTotalWeeks / 2 > $scope.physicalActivityWeeks ? 'circle-red' : $scope.physicalActivityTotalWeeks < $scope.physicalActivityWeeks ? 'circle-green' : 'circle-orange',
                  labelWeeks: $scope.physicalActivityWeeks + " / " + $scope.physicalActivityTotalWeeks
                };

                if (!$scope.$$phase) {
                  $scope.$apply();
                }
              });

          }

        };


        RecomendationService.getCurrentRecomendation($scope.selectedUser.id, function (recomendation) {
          if (recomendation) {
            var level = recomendation.level;
            $scope.currentRecomendation = recomendation.toJson();
            $scope.currentRecomendation.level = level;

            for (var k = 0; k < 7; k++) {
              fillSerie(k, $scope.currentWeek);
            }


            for (var i = 0; i < $scope.currentRecomendation.exercises.length; i++) {
              var obj = $scope.currentRecomendation.exercises[i];

              var roundedMinutes = Math.round(obj.duration / 60);
              var roundedSeconds = (obj.duration % 60);

              if (obj.type == PhysicalActivityType.RUN) {
                $scope.chartSpeeds.trendlines[1].startvalue = obj.duration;
                $scope.chartSpeeds.trendlines[1].tooltext = "Corrida" + roundedMinutes + ":" + roundedSeconds + "m";
              } else if (obj.type == PhysicalActivityType.WALK) {
                $scope.chartSpeeds.trendlines[0].startvalue = obj.duration;
                $scope.chartSpeeds.trendlines[0].tooltext = "Andar" + roundedMinutes + ":" + roundedSeconds + "m";
              }
            }

            $scope.chartSpeeds.trendlines = [
              {
                "line": [
                  {
                    "startvalue": "600",
                    "color": "#0075c2",
                    "displayvalue": "Caminhada",
                    "valueOnRight": "1",
                    "thickness": "1",
                    "showBelow": "1",
                    "tooltext": "Andar: " + roundedMinutes + ":" + roundedSeconds + "m"
                  },
                  {
                    "startvalue": "200",
                    "color": "#1aaf5d",
                    "displayvalue": "Corrida",
                    "valueOnRight": "1",
                    "thickness": "1",
                    "showBelow": "1",
                    "tooltext": "Corrida: " + roundedMinutes + ":" + roundedSeconds + "m"
                  }
                ]
              }
            ];
            $scope.calculatePhysicalActivityStats(recomendation);
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
  .controller('PhysicalActivityCtrl', function ($scope, $ionicLoading, ModalService, RecomendationService, Recomendation, PhysicalActivityType, RecomendationLevel) {

    $scope.updateRecomendationLevel = function(){
      $scope.recomendation.level = RecomendationLevel.CUSTOM;
    };

    RecomendationService.getCurrentRecomendation($scope.selectedUser.id, function (recomendation) {
      if (recomendation && recomendation !== null) {
        var level = recomendation.level;
        $scope.recomendation = recomendation.toJson();
        $scope.recomendation.level = level;
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
    $scope.recomendationLevels = Object.keys(RecomendationLevel).map(function (key) {
      return RecomendationLevel[key]
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
      if ($scope.recomendation.exercises[index] && !$scope.recomendation.exercises[index].type) {
        $scope.recomendation.exercises[index].type = optionsToReturn[0];
      }
      return optionsToReturn;
    };
    $scope.addExercise = function (index) {
      $scope.recomendation.exercises.splice(index + 1, 0, {
        duration: 15,
        frequency: 2
      });
      $scope.updateRecomendationLevel();
    };
    $scope.removeExercise = function (index) {
      $scope.recomendation.exercises.splice(index, 1);
      $scope.updateRecomendationLevel();
    };

    $scope.updateRecomendation = function () {
      if ($scope.recomendation.level === RecomendationLevel.INTENSE) {
        $scope.recomendation.exercises = [{
          duration: 10,
          frequency: 5,
          type: PhysicalActivityType.WALK
        },{
          duration: 20,
          frequency: 5,
          type: PhysicalActivityType.RUN
        }];
      } else if ($scope.recomendation.level === RecomendationLevel.MODERATE) {
        $scope.recomendation.exercises = [{
          duration: 10,
          frequency: 3,
          type: PhysicalActivityType.WALK
        },{
          duration: 10,
          frequency: 3,
          type: PhysicalActivityType.RUN
        }];
      }
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
      RecomendationService.addRecomendation($scope.selectedUser.id, new Recomendation($scope.recomendation.level, $scope.recomendation.exercises), handler());
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

          var level = obj.level;

          var aux = obj.toJson();
          aux.level = level;
          $scope.recomendations.push(aux);
        }
        $scope.currentIndex = $scope.recomendations.length - 2;
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
