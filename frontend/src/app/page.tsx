/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ShoppingCart, Heart } from "lucide-react";
import { CreditCard, Truck, ShieldCheck } from "lucide-react";
import "./Home.css";

export default function Home() {
  return (
    <div className="home">
      
      <header className="header">
      <div className="container header-container">
        {/* Logo */}
        <div className="logo">
          <div className="logo-img">
            <Link href="/">
              <img src="/icons/logomed.png" alt="Logo MedBay" />
            </Link>
          </div>
          <Link href="/">
            <span className="logo-text1">Med</span>
            <span className="logo-text2">Bay</span>
          </Link>
        </div>

        {/* Navegación */}
        <nav className="nav">
          <Link href="/Characteristics">Características</Link>
          <Link href="/About">Nosotros</Link>
          <Link href="/Contact">Contacto</Link>
        </nav>

        {/* Botones + Iconos */}
        <div className="header-buttons flex items-center gap-3">
          <a href="/login" className="btn-outline">
            Iniciar sesión
          </a>
          <a href="/register" className="btn-primary">
            Registrarse
          </a>
          <Link href="/wishlist" className="icon-btn">
            <Heart size={22} />
          </Link>
          <Link href="/cart" className="icon-btn">
            <ShoppingCart size={22} />
          </Link>
        </div>
      </div>
    </header>
  
      <section className="intro-section">
        <div className="intro-overlay">
          <div className="intro-container">
            <div className="intro-search">
              <input
                type="text"
                placeholder="Buscar productos..."
                className="search-input"
              />
              <button className="search-button">Buscar</button>
            </div>
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
          </div>
        </div>
      </section>

     <section className="product-category-section">
        <div className="container category-nav-bar">
          <a href="/products?category=surgical">Material quirúrgico</a>
          <a href="/products?category=instrumental">Instrumental médico</a>
          <a href="/products?category=hospital-equipment">Equipo hospitalario</a>
          <a href="/products?category=consumables">Consumibles</a>
          <a href="/products?category=consumables">Suturas</a>
        </div>

        <div className="container promo-card-container">
          <div className="promo-card">
            <div className="promo-content">
              <h2>Equipamiento <span>Médico</span> </h2>
              <p>Encuentra los mejores equipos de protección.
                Precisión que salva. <br />
                Suministros que transforman.
              </p>
              <a href="/Products" className="intro-button">Ver productos</a>

            </div>
            <div className="promo-image">
              <img src="/Images/Home2.png" alt="Mascarilla de protección médica" className="mask-image" />
            </div>
          </div>
        </div>
      </section>
      <section className="hero products-section">
  <div className="container">
    <h1>
      Lo más solicitado en <span>Insumos Médicos</span>
    </h1>
    <p>
      Enfocados en la excelencia ortopédica, proveemos el instrumental y los insumos de más alta calidad, garantizando procedimientos seguros y resultados óptimos para el paciente. Calidad certificada, a tiempo, en cada entrega.
    </p>

    <div className="product-grid">
      <div className="product-card">
        <img src="/images/guantes.png" alt="Guantes" />
        <h3>Guantes de Nitrilo</h3>
        <p>$189.99</p>
        <button>Agregar al carrito</button>
      </div>

      <div className="product-card">
        <img src="/images/bata.png" alt="Bata médica" />
        <h3>Bata médica</h3>
        <p>$149.99</p>
        <button>Agregar al carrito</button>
      </div>

      <div className="product-card">
        <img src="/images/mascarilla.png" alt="Mascarilla" />
        <h3>Mascarilla quirúrgica</h3>
        <p>$249.99</p>
        <button>Agregar al carrito</button>
      </div>

      <div className="product-card">
        <img src="/images/termometro.png" alt="Termómetro" />
        <h3>Termómetro digital</h3>
        <p>$599.99</p>
        <button>Agregar al carrito</button>
      </div>

      <div className="product-card">
        <img src="/images/termometro.png" alt="Termómetro" />
        <h3>Termómetro digital</h3>
        <p>$599.99</p>
        <button>Agregar al carrito</button>
      </div>
    </div>
  </div>
</section>

<section className="benefits-section">
      <div className="benefits-container">
        
        <div className="benefit-item">
          <CreditCard className="benefit-icon" />
          <h3 className="benefit-title">Elige cómo pagar</h3>
          <p className="benefit-text">
            Puedes pagar con tarjeta, débito, efectivo o con Meses sin Tarjeta.
          </p>
        </div>

        <div className="benefit-item">
          <Truck className="benefit-icon" />
          <h3 className="benefit-title">Envío gratis desde $999</h3>
          <p className="benefit-text">
            Al registrarte en MedBay tienes envíos gratis en miles de productos.
          </p>
        </div>

        <div className="benefit-item">
          <ShieldCheck className="benefit-icon" />
          <h3 className="benefit-title">Seguridad de principio a fin</h3>
          <p className="benefit-text">
            ¿No te gusta? ¡Devuélvelo! En MedBay estás siempre protegido.
          </p>
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
