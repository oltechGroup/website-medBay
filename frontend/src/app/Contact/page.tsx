/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import "./Contact.css";

export default function Contacto() {
  return (
    <div className="contacto">

      <header className="header">
        <div className="container header-container">
          <div className="logo">
            <div className="logo-img">
             <Link href="/"><img src="/icons/logomed.png" alt="Logo MedBay"/></Link>
            </div>
            <Link href="/"><span className="logo-text1">Med</span><span className="logo-text2">Bay</span></Link>
          </div>
        |  <nav className="nav">
            <Link href="/Characteristics">Características</Link>
            <Link href="/About">Nosotros</Link>
            <Link href="/Contact">Contacto</Link>
          </nav>
          <div className="header-buttons">
            <a href="/login" className="btn-outline">
              Iniciar sesión
            </a>
            <a href="/register" className="btn-primary">
              Registrarse
            </a>
          </div>
        </div>
      </header>

      <section className="contacto-header">
        <h1>Contáctanos</h1>
        <p>
          Si tienes dudas, comentarios o quieres más información sobre MedBay,
          completa el formulario y nos pondremos en contacto contigo.
        </p>
      </section>

      <section className="contacto-formulario">
        <form className="form">
          <label>
            Nombre
            <input type="text" placeholder="Tu nombre completo" required />
          </label>

          <label>
            Correo Electrónico
            <input type="email" placeholder="tu@correo.com" required />
          </label>

          <label>
            Mensaje
            <textarea placeholder="Escribe tu mensaje..." required></textarea>
          </label>

          <button type="submit">Enviar Mensaje</button>
        </form>
      </section>
    </div>
  );
}
