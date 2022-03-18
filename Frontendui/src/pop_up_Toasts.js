const Swal = require("sweetalert2");

const toaster = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 5000,
  timerProgressBar: true,
  onOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

const showMessage = (type, msg) => {
  toaster.fire({
    icon: type,
    title: msg,
  });
};

export default showMessage;