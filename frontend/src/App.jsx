import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import RegisterBatch from "./pages/RegisterBatch";
import Scan from "./pages/Scan";
import Login from "./pages/Login";
import RegisterAccount from "./pages/RegisterAccount";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<RegisterBatch />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/scan/:id" element={<Scan />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register-account" element={<RegisterAccount />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
