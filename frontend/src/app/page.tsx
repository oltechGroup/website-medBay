/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import "./Home.css";

export default function Home() {
  return (
    <div className="home">
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

     
      <section className="intro-section">
        <div className="intro-overlay">
          <div className="intro-container">
            <div className="intro-top-cards">
              <a href="/products/active" className="intro-card">
                <img src="/icons/enfecha.png" alt="Productos en fecha" className="intro-icon" />
                <span>Productos en fecha</span>
              </a>
              <a href="/products/soon-expire" className="intro-card">
                <img src="/icons/tiempoexp.png" alt="Pronto a expirar" className="intro-icon" />
                <span>Pronto a expirar</span>
              </a>
              <a href="/products/expired" className="intro-card">
                <img src="/icons/caducados.png" alt="Expirados" className="intro-icon" />
                <span>Expirados</span>
              </a>
            </div>
            <div className="intro-content">
              <p className="intro-text">
                &quot;Donde la precisión médica se une a tu cuidado. Encuentra lo que necesitas para vivir mejor."
              </p>
              <a href="/register" className="intro-button">Empezar</a>
            </div>
          </div>
        </div>
      </section>

     <section className="product-category-section">
        {/* Barra de navegación de categorías */}
        <div className="container category-nav-bar">
          <a href="/products?category=surgical">Material quirúrgico</a>
          <a href="/products?category=instrumental">Instrumental médico</a>
          <a href="/products?category=hospital-equipment">Equipo hospitalario</a>
          <a href="/products?category=consumables">Consumibles</a>
        </div>

        {/* Banner promocional */}
        <div className="container promo-card-container">
          <div className="promo-card">
            <div className="promo-content">
              <h2>Equipamiento Médico</h2>
              <p>Encuentra los mejores equipos de protección.</p>
              <a href="/products?category=protection" className="btn-secondary">
                Ver productos
              </a>
            </div>
            <div className="promo-image">
              {/* Placeholder para la imagen de la mascarilla. Simula la imagen del asset. */}
              <img 
                src="/Images/Home2.png" 
                alt="Mascarilla de protección médica"
                // El estilo para simular la imagen de la mascarilla se define en el <style> tag.
                className="mask-image"
              />
            </div>
          </div>
        </div>
      </section>


      <section className="hero">
        <div className="container">
          <h1>
            Marketplace Especializado en <span>Insumos Médicos</span>
          </h1>
          <p>
            Conectamos proveedores con hospitales, clínicas y profesionales de
            la salud en un solo lugar.
          </p>
          <div className="hero-buttons">
            <a href="/register?type=supplier" className="btn-primary">
              Soy Proveedor
            </a>
            <a href="/register?type=buyer" className="btn-outline">
              Soy Comprador
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="features">
        <div className="container">
          <h2>Características Principales</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>Gestión de Productos</h3>
              <p>
                Administra tus artículos médicos de manera simple, actualiza
                precios, inventarios y detalles en tiempo real.
              </p>
            </div>
            <div className="feature-card">
              <h3>Importación Inteligente</h3>
              <p>
                Carga masiva de productos desde archivos Excel o bases de datos
                externas con validación automática.
              </p>
            </div>
            <div className="feature-card">
              <h3>Panel Administrativo</h3>
              <p>
                Control total del catálogo, proveedores y órdenes mediante un
                dashboard moderno y seguro.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="container">
          <h2>Únete hoy a MedBay</h2>
          <p>Optimiza la gestión de tus productos médicos con nuestra plataforma.</p>
          <a href="/register" className="btn-primary cta-button">
            Comenzar ahora
          </a>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-content">
          <p>© 2025 MedBay. Todos los derechos reservados.</p>
          <div className="footer-links">
            <a href="#privacy">Privacidad</a>
            <a href="#terms">Términos</a>
            <a href="#contact">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
