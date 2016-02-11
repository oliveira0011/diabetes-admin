angular.module('app.controllers', [])
  /**
   *
   * APPLICATION CONTROLLER
   */
  .controller('AppCtrl', function ($scope, $state, FirebaseFactory) {
    $scope.logout = function () {
      FirebaseFactory.getDBConnetion().unauth();
      $state.go('login');
    }
  })
  /**
   * USERS CONTROLLERS
   */
  .controller('UsersCtrl', function ($scope, $timeout, $window, $state, UserFormFactory, FirebaseFactory) {
    var dbConnection = FirebaseFactory.getDBConnetion();
    dbConnection.child("users").on('value', function (snap) {
      console.log('accounts matching email address', snap.val());
      $scope.users = snap.val();
      for (user in $scope.users) {
        $scope.users[user].id = user;
      }
    });
    $scope.loadImage = function (user) {
      console.log(user);
      return dbConnection.child("profileImages").child(user.id).on('value', function (data) {
        user.profileImage = data.val().image;
        if (!$scope.$$phase) {
          $scope.$apply();
        }
      });
    };
  })
  .controller('UserCtrl', function ($scope, UserFormFactory, FirebaseFactory, $stateParams, $rootScope, $ionicLoading, $ionicPopup, $state) {

    $scope.init = function () {
      if (!$scope.isNewUser) {
        $scope.options = [
          {
            description: 'Dados Pessoais',
            templateUrl: "templates/user.personal.html",
            callback: function () {
              $scope.currentOption = this;
              console.log('ok');
            }
          }, {
            description: 'Atividade Física',
            templateUrl: "templates/user.biometric.html",
            callback: function () {
              $scope.currentOption = this;
              console.log($scope.currentOption);
            }
          }, {
            description: 'Exercícios Recomendados',
            templateUrl: "templates/user.biometric.html",
            callback: function () {
              $scope.currentOption = this;
              console.log($scope.currentOption);
            }
          }, {
            description: 'Dados Biométricos',
            templateUrl: "templates/user.biometric.html",
            callback: function () {
              $scope.currentOption = this;
              console.log($scope.currentOption);
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
            console.log('ok');
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
          var dbConnection = FirebaseFactory.getDBConnetion();
          dbConnection.child('users').child($stateParams.uid).once('value', function (snap) {
            console.log(snap);
            console.log(snap.val());
            var profileImageUid = snap.val().profileImageUid;
            if (profileImageUid) {
              dbConnection.child('profileImages').child(profileImageUid).remove(function () {
                console.log("Profile Image Removed");
              });
            }
            dbConnection.child('users').child($stateParams.uid).remove(function () {
              $ionicLoading.hide();
              $state.go('app.users');
            });
          });
        }
      });
    };
    $rootScope.$on('changeOption', function (e, data) {
      $state.go('app.useredit', {uid: data.userId, option: data.option});
    });

    if ($stateParams.uid !== undefined) {

      FirebaseFactory.getDBConnetion().child("users").child($stateParams.uid).on('value', function (snap) {
        console.log(snap.val());
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
  .controller('UserPersonalCtrl', function ($scope, $timeout, $window, $state, UserFormFactory, FirebaseFactory, $stateParams, $ionicLoading, $ionicPopup, $rootScope) {
    var dbConnection = FirebaseFactory.getDBConnetion();
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
            console.log($scope.user.profileImage.value);
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
    $scope.saveImageData = function (userId, image) {
      /**
       * save the image if changed
       */
      if ($scope.user.profileImage.changed) {
        console.log($scope.retrievedUser.profileImageUid);
        console.log("image changed");
        if (!$scope.retrievedUser.profileImageUid || $scope.retrievedUser.profileImageUid === '') {
          console.log(userId);
          console.log($scope.retrievedUser);
          delete image.changed;
          var newImagesRef = dbConnection.child("profileImages").child(userId).set({
            image: image
          });
          console.log("saved image with uid: " + userId);
          $scope.redirectToUsersList();
        } else {
          console.log("update");
          console.log(image);
          dbConnection.child("profileImages").child(userId).update({
            image: image
          }, function (error) {
            if (error) {
              console.log('Image save failed');
              console.log(error);
            } else {
              console.log('Image updated');
              $scope.redirectToUsersList(userId);
            }
          });
        }
      } else {
        console.log('no need for any update on the image');
        $scope.redirectToUsersList(userId);
      }

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
                $state.go('app.users');
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
      $state.go('app.users');
    };
    $scope.saveUser = function (form) {
      $scope.invalidMessages = {};
      if (form.$invalid) {
        console.log(form);
        return;
      }
      $ionicLoading.show({template: "A gravar informação..."});
      angular.forEach($scope.user, function (userValue, userKey) {
        var changed = false;
        angular.forEach($scope.retrievedUser, function (retrievedUserValue, retrievedUserKey) {
          if (!changed && retrievedUserKey === userKey) {
            $scope.retrievedUser[retrievedUserKey] = userValue.value;
            changed = true;
          }
        });
        if (!changed) {
          $scope.retrievedUser[userKey] = userValue.value;
        }
      });

      console.log($scope.retrievedUser);
      console.log("----");
      console.log($scope.user);

      var image = $scope.retrievedUser.profileImage;
      delete  $scope.retrievedUser.profileImage;

      var usersRef = dbConnection.child("users");
      var userId = $stateParams.uid;
      console.log("new user? " + $scope.isNewUser);
      if ($scope.isNewUser) {
        /**
         * SAVE THE NEW USER INFO
         */
        console.log($scope.retrievedUser);
        dbConnection.createUser({
          email: $scope.retrievedUser.email,
          password: $scope.retrievedUser.password
        }, function (error, userData) {
          console.log("aqui");
          if (error) {
            switch (error.code) {
              case "EMAIL_TAKEN":
                $scope.invalidMessages = ["O email introduzido já se encontra em utilização, por favor insira outro email."];
                break;
              case "INVALID_EMAIL":
                $scope.invalidMessages = ["O email introduzido não é válido. Por favor, reveja-o e submeta a informação novamente."];
                break;
              default:
                $scope.invalidMessages = ["A definição de uma palavra-passe para o utente é obrigatória"];
                console.log("Error creating user:", error);
            }
            $ionicLoading.hide();
          } else {
            console.log($scope.retrievedUser.uid);
            userId = userData.uid;
            delete  $scope.retrievedUser.password;
            delete  $scope.retrievedUser.uid;
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
        console.log($scope.user.password);
        if ($scope.user.password.value) {
          dbConnection.resetPassword({
            email: $scope.retrievedUser.email
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
        delete  $scope.retrievedUser.password;
        usersRef.child($stateParams.uid).update($scope.retrievedUser, function () {
          console.log("user update");
        });
        $scope.saveImageData(userId, image);
      }
    }
  })
  .controller('MainCtrl', function ($scope, $timeout, $window, $state) {
    $scope.options = [
      {name: "Registos", color: "stable", icon: "ion-compose"},
      {name: "Amigos", color: "stable", icon: "ion-person-stalker"},
      {name: "Definições", color: "stable", icon: "ion-gear-a"}
    ];

    $scope.redirect = function () {
      $state.go('app.search');
    };
    $scope.resizePnlBtns = function () {
      var height = angular.element(document.querySelector('#pnlContent'))[0].clientHeight;
      var newHeight = (height / $scope.options.length) - 15;
      for (var counter = 0; counter < $scope.options.length; counter++) {
        document.getElementsByClassName("option-button")[counter].style.height = newHeight + "px";
      }
    };
    angular.element($window).on('resize', function () {
      $scope.$apply(function () {
        // ... perform your magic here
        $scope.resizePnlBtns();
      });
    });
    $timeout(function () {
      $scope.resizePnlBtns();
    });
  })
  .controller('BiometricosCtrl', function ($scope) {
    $scope.biometricos = [
      {title: 'Reggae', id: 1},
      {title: 'Chill', id: 2},
      {title: 'Dubstep', id: 3},
      {title: 'Indie', id: 4},
      {title: 'Rap', id: 5},
      {title: 'Cowbell', id: 6}
    ];
  })
  .controller('LoginCtrl', function ($scope, $state, $stateParams, FirebaseFactory, $ionicPopup, $ionicLoading) {

    $scope.loginData = {};
    $scope.doLogin = function (form) {
      delete $scope.errorMessage;
      //console.log(form.$valid);
      if (form.$valid) {
        $ionicLoading.show({template: 'A autenticar...'});
        console.log($scope.loginData);
        var dbConnection = FirebaseFactory.getDBConnetion();

        function authHandler(error, authData) {
          if (error) {
            console.log("Login Failed!", error);
          } else {
            console.log("Authenticated successfully with payload:", authData);
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
                      console.log(!$scope.data.newPassword);
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
                console.log(res);
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
              console.log(!$scope.data.email);
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
        console.log(res);
        FirebaseFactory.getDBConnetion().resetPassword({
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
  .controller('PlaylistCtrl', function ($scope, $stateParams) {
  });
