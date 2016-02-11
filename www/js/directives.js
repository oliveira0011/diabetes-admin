angular.module('app.directives', []).directive('dynAttr', function ($compile) {
  return {
    scope: {
      value: '=dynAttr'
    },
    link: function (scope, elem, attrs) {
      for (var attr in scope.value.constraints) {
        if (scope.value.constraints.hasOwnProperty(attr)) {
          attrs.$set(attr, scope.value.constraints[attr]);
        }
      }
      $compile(elem.contents())(scope);
      return scope;
    }
  };
});
