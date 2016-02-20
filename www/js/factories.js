angular.module('app.factories', [])
  .factory('BiomedicType', function () {
    return {
      HEMOGLOBIN: 'hemoglobin',
      BLOOD_PRESSURE: 'blood-pressure',
      MIN_BLOOD_PRESSURE: 'min-blood-pressure',
      MAX_BLOOD_PRESSURE: 'max-blood-pressure',
      CHOLESTEROL: 'cholesterol',
      WEIGHT: 'weight'
    }
  })
  .factory('MessageType', function () {
    return {
      CUSTOM: 'custom',
      ACTIVITY_REEVALUATION: 'activity-reevaluation',
    }
  })
  .factory('PhysicalActivityType', function () {
    return {
      WALK: 'walk',
      RUN: 'run'
    }
  })
  .factory('PhysicalActivity', function (PhysicalActivityType) {
    var PhysicalActivity = function (frequency, duration, type) {
      this.id = 0;
      this.frequency = frequency;
      this.duration = duration;
      if (!type instanceof PhysicalActivityType.constructor) {
        throw 'The type must be a PhysicalActivityType';
      }
      this.type = type;
    };
    return PhysicalActivity;
  })
  .factory('Recomendation', function (PhysicalActivity) {
    var Recomendation = function (exercises) {
      this.id = 0;
      this.exercises = [];
      if (!type instanceof Array.constructor) {
        throw 'The exercises must be an array';
      }
      for (var i = 0; i < exercises.length; i++) {
        var obj = exercises[i];
        this.exercises[i] = new PhysicalActivity(obj.frequency, obj.duration, obj.type);
      }
      this.date = new Date().getTime();
    };
    return Recomendation;
  })
  .factory('Message', function (MessageType) {
    var Message = function (title, body, type) {
      this.id = 0;
      this.title = title;
      this.body = body;
      this.date = new Date().getTime();
      if (!type instanceof MessageType.constructor) {
        throw 'The type must be a MessageType';
      }
      this.type = type;
    };
    return Message;
  })
  .factory('Biomedic', function () {
    function Biomedic(biomedicDate, value) {
      if (this.constructor === Biomedic) {
        throw new Error("Can't instantiate abstract class!");
      }
      this.id = 0;
      this.biomedicDate = biomedicDate;
      this.value = value;
    }

    Biomedic.prototype.type = function () {
      throw new Error("Abstract method!");
    };
    return Biomedic;
  })
  .factory('Hemoglobin', function (Biomedic, BiomedicType) {
    var Hemoglobin = function () {
      Biomedic.apply(this, arguments);
      this.type = BiomedicType.HEMOGLOBIN;
    };
    Hemoglobin.prototype = Object.create(Biomedic.prototype);
    Hemoglobin.prototype.constructor = Hemoglobin;

    return Hemoglobin;
  })
  .factory('BloodPressure', function (Biomedic) {
    var BloodPressure = function () {
      if (this.constructor === BloodPressure) {
        throw new Error("Can't instantiate abstract class!");
      }
      Biomedic.apply(this, arguments);
    };
    BloodPressure.prototype = Object.create(Biomedic.prototype);
    BloodPressure.prototype.constructor = BloodPressure;
    return BloodPressure;
  })
  .factory('MinBloodPressure', function (BloodPressure, BiomedicType) {
    var MinBloodPressure = function () {
      BloodPressure.apply(this, arguments);
      this.type = BiomedicType.MIN_BLOOD_PRESSURE;
    };
    MinBloodPressure.prototype = Object.create(BloodPressure.prototype);
    MinBloodPressure.prototype.constructor = MinBloodPressure;
    return MinBloodPressure;
  })
  .factory('MaxBloodPressure', function (BloodPressure, BiomedicType) {
    var MaxBloodPressure = function () {
      BloodPressure.apply(this, arguments);
      this.type = BiomedicType.MAX_BLOOD_PRESSURE;
    };
    MaxBloodPressure.prototype = Object.create(BloodPressure.prototype);
    MaxBloodPressure.prototype.constructor = MaxBloodPressure;
    return MaxBloodPressure;
  })
  .factory('Cholesterol', function (Biomedic, BiomedicType) {
    var Cholesterol = function () {
      Biomedic.apply(this, arguments);
      this.type = BiomedicType.CHOLESTEROL;
    };
    Cholesterol.prototype = Object.create(Biomedic.prototype);
    Cholesterol.prototype.constructor = Cholesterol;
    return Cholesterol;
  })
  .factory('Weight', function (Biomedic, BiomedicType) {
    var Weight = function () {
      Biomedic.apply(this, arguments);
      this.type = BiomedicType.WEIGHT;
    };
    Weight.prototype = Object.create(Biomedic.prototype);
    Weight.prototype.constructor = Weight;
    return Weight;
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
            maxlength: 'A morada do utente deve possuir, no máximo, 200 carateres',
          }
        },
        height: {
          placeHolder: 'Altura',
          value: '',
          type: 'number',
          constraints: {
            required: true,
            min: 0
          },
          errorMessages: {
            required: 'A altura do utente é obrigatória',
            min: 'A altura do utente deve ser superior a 0 cm'
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

      angular.forEach(structure, function (item) {
        if (item.constraints && item.constraints['required']) {
          item.required = true;
        }
      });
      console.log(structure);
      return structure;
    };

    return factory;
  });
