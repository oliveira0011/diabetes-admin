angular.module('app.factories', [])
  .factory('FirebaseFactory', function ($firebaseObject) {
    var firebaseFactory = {};
    firebaseFactory.getDBConnetion = function () {
      return new Firebase("https://diabetes.firebaseio.com");
    };
    return firebaseFactory;
  })
  .factory('UserFormFactory', function () {
    ///returns the form structure needed for the creation of a user
    var factory = {};

    factory.getUserStructure = function (newUser) {
      var structure = {
        profileImage: {
          placeHolder: 'Imagem de Perfil',
          value: '',
          type: 'image'
        },
        firstName: {
          placeHolder: 'Primeiro Nome',
          value: '',
          type: 'text',
          constraints: {
            'required': true,
            'minlength': 2,
            'maxlength': 50,
            'pattern': /^[a-zA-Z-]+$/
          },
          errorMessages: {
            'required': 'O primeiro nome do utente é obrigatório',
            'maxlength': 'O primeiro nome do utente deve possuir entre 2 a 50 carateres',
            'minlength': 'O primeiro nome do utente deve possuir entre 2 a 50 carateres',
            'pattern': 'O primeiro nome do utente deve apenas conter letras e/ou o carater \'-\''
          }
        },
        lastName: {
          placeHolder: 'Apelido',
          value: '',
          type: 'text',
          constraints: {
            required: true,
            minlength: 2,
            maxlength: 50,
            'pattern': /^[a-zA-Z-\s]+$/
          },
          errorMessages: {
            required: 'O apelido do utente é obrigatório',
            maxlength: 'O apelido do utente deve possuir entre 2 a 50 carateres',
            minlength: 'O apelido do utente deve possuir entre 2 a 50 carateres',
            'pattern': 'O apelido do utente deve apenas conter letras, espaços e/ou o carater \'-\''
          }
        },
        email: newUser ? {
          placeHolder: 'Email',
          value: '',
          type: 'email',
          constraints: {
            required: true,
            minlength: 5,
            maxlength: 50,
            pattern: /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i
          },
          errorMessages: {
            required: 'O email do utente é obrigatório',
            maxlength: 'O email do utente deve possuir entre 5 a 50 carateres',
            minlength: 'O email do utente deve possuir entre 5 a 50 carateres',
            pattern: 'O email inserido não é válido'
          }
        } : {
          placeHolder: 'Email',
          value: '',
          type: 'label'
        },
        address: {
          placeHolder: 'Morada',
          value: '',
          type: 'text',
          constraints: {
            required: false,
            maxlength: 200
          },
          errorMessages: {
            required: 'A morada do utente é obrigatório',
            maxlength: 'A morada do utente deve possuir, no máximo, 200 carateres',
          }
        }
      };

      if (newUser) {
        structure.password = {
          placeHolder: 'Palavra-Passe',
          value: '',
          constraints: {
            required: true
          },
          type: 'password',
          errorMessages: {
            required: 'A definição de uma palavra-passe para o utente é obrigatória'
          }
        };
      } else {
        structure.password = {
          value: false,
          type: 'resetpassword'
        };
      }

      angular.forEach(structure, function(item){
        if(item.constraints && item.constraints['required']){
         item.required = true;
        }
      });
      console.log(structure);
      return structure;
    };

    return factory;
  });
