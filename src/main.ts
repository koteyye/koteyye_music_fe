import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "./style.css";

// Fonts
import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/700.css";
import "@fontsource/montserrat/900.css";

const app = createApp(App);

const pinia = createPinia();

app.use(pinia);
app.use(router);
app.mount("#app");
