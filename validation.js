function Validator(options) {
  // hàm lấy ra element ngoài cùng
  function getParent(element, selector) {
    while (element.parentElement) {
      if (element.parentElement.matches(selector)) {
        return element.parentElement;
      }
      element = element.parentElement;
    }
  }

  //
  var selectorRules = {};

  // hàm thực thi hiện ra lỗi / bỏ lỗi đi (validate)
  function validate(inputElement, rule) {
    // value: inputElement.value
    // function test: rule.test
    var parentElement = getParent(inputElement, options.formGroupSelector);

    var errorElement = parentElement.querySelector(options.errorSelector);
    var errorMessage;

    // lấy ra các rules của selector
    var rules = selectorRules[rule.selector];

    // lặp qua từng rules và kiểm tra, nếu có lỗi thì dừng
    for (var i = 0; i < rules.length; i++) {
      switch (inputElement.type) {
        case "radio":
        case " checkbox":
          errorMessage = rules[i](
            formElement.querySelector(rule.selector + ":checked")
          );
          break;
        default:
          errorMessage = rules[i](inputElement.value);
      }
      if (errorMessage) break;
    }

    if (errorMessage) {
      errorElement.innerText = errorMessage;
      parentElement.classList.add("invalid");
    } else {
      errorElement.innerText = "";
      parentElement.classList.remove("invalid");
    }

    return !errorMessage;
  }

  // lấy element của form cần validate
  var formElement = document.querySelector(options.form);
  if (formElement) {
    // khi submit form
    formElement.onsubmit = function (e) {
      e.preventDefault();
      var isFormValid = true;

      // lặp qua từng rule và validate
      options.rules.forEach(function (rule) {
        var inputElement = formElement.querySelector(rule.selector);
        var isValid = validate(inputElement, rule);
        if (!isValid) {
          isFormValid = false;
        }
      });

      if (isFormValid) {
        // submit với javascript
        if (typeof options.onSubmit === "function") {
          var enableInputs = formElement.querySelectorAll("[name]");
          var formValues = Array.from(enableInputs).reduce(function (
            values,
            input
          ) {
            switch (input.type) {
              case "radio":
                values[input.name] = formElement.querySelector(
                  'input[name="' + input.name + '"]:checked'
                ).value;
                break;

              case "checkbox":
                if (!input.matches(":checked")) {
                  if (!Array.isArray(values[input.name])) {
                    values[input.name] = "";
                  }
                  return values;
                }
                if (!Array.isArray(values[input.name])) {
                  values[input.name] = [];
                }
                values[input.name].push(input.value);
                break;

              case "file":
                values[input.name] = input.files;
                break;

              default:
                values[input.name] = input.value;
            }

            return values;
          },
          {});

          options.onSubmit(formValues);
        }

        // submit với hành vi mặc định
        else {
          formElement.submit();
        }
      }
    };

    // lặp qua mỗi rule và xử lí (lắng nghe sự kiện blur, input, ...)
    options.rules.forEach(function (rule) {
      // lưu lại các rules cho mỗi input
      if (Array.isArray(selectorRules[rule.selector])) {
        selectorRules[rule.selector].push(rule.test);
      } else {
        selectorRules[rule.selector] = [rule.test];
      }

      // lấy ra các input được selector
      var inputElements = formElement.querySelectorAll(rule.selector);
      Array.from(inputElements).forEach(function (inputElement) {
        // xử lý trường hợp blur khỏi input
        inputElement.onblur = function () {
          validate(inputElement, rule);
        };

        // xử lý mỗi khi người dùng nhập vào input
        var parentElement = getParent(inputElement, options.formGroupSelector);
        inputElement.oninput = function () {
          var errorElement = parentElement.querySelector(options.errorSelector);
          errorElement.innerText = "";
          parentElement.classList.remove("invalid");
        };
      });
    });
  }
}

// Định nghĩa rules
// 1. Khi có lỗi: trả ra message lỗi
// 2. Khi hợp lệ: trả ra undefined
Validator.isRequired = function (selector) {
  return {
    selector: selector,
    test: function (value) {
      return value ? undefined : "Vui lòng nhập trường này";
    },
  };
};

Validator.isEmail = function (selector) {
  return {
    selector: selector,
    test: function (value) {
      var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      return regex.test(value) ? undefined : "Trường này phải là email";
    },
  };
};

Validator.minLength = function (selector, min) {
  return {
    selector: selector,
    test: function (value) {
      return value.length >= min
        ? undefined
        : `Vui lòng nhập tối thiểu ${min} ký tự`;
    },
  };
};

Validator.isConFirmed = function (selector, getConFirmValue, message) {
  return {
    selector: selector,
    test: function (value) {
      return value === getConFirmValue()
        ? undefined
        : message || "Giá trị nhập vào không chính xác";
    },
  };
};
