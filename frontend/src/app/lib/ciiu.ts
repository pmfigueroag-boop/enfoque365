// ---------------------------------------------------------------------------
// CIIU / ISIC Rev.4 -- Clasificacion completa (4 niveles)
// Secciones, Divisiones, Grupos y Clases
// Datos estaticos para el wizard de onboarding de ENFOQUE 365
// Sin acentos, sin emojis. Texto en espanol ASCII.
// ---------------------------------------------------------------------------

export interface CiiuSeccion {
  code: string;
  name: string;
}

export interface CiiuDivision {
  code: string;
  name: string;
}

export interface CiiuGrupo {
  code: string;
  name: string;
}

export interface CiiuClase {
  code: string;
  name: string;
}

// ---- 21 Secciones ISIC Rev.4 ------------------------------------------------

export const CIIU_SECCIONES: CiiuSeccion[] = [
  { code: 'A', name: 'Agricultura, ganaderia, silvicultura y pesca' },
  { code: 'B', name: 'Explotacion de minas y canteras' },
  { code: 'C', name: 'Industrias manufactureras' },
  { code: 'D', name: 'Suministro de electricidad, gas, vapor y aire acondicionado' },
  { code: 'E', name: 'Suministro de agua; evacuacion de aguas residuales' },
  { code: 'F', name: 'Construccion' },
  { code: 'G', name: 'Comercio al por mayor y al por menor' },
  { code: 'H', name: 'Transporte y almacenamiento' },
  { code: 'I', name: 'Alojamiento y servicios de comida' },
  { code: 'J', name: 'Informacion y comunicaciones' },
  { code: 'K', name: 'Actividades financieras y de seguros' },
  { code: 'L', name: 'Actividades inmobiliarias' },
  { code: 'M', name: 'Actividades profesionales, cientificas y tecnicas' },
  { code: 'N', name: 'Actividades de servicios administrativos y de apoyo' },
  { code: 'O', name: 'Administracion publica y defensa' },
  { code: 'P', name: 'Ensenanza' },
  { code: 'Q', name: 'Actividades de atencion de la salud humana' },
  { code: 'R', name: 'Actividades artisticas, de entretenimiento y recreativas' },
  { code: 'S', name: 'Otras actividades de servicios' },
  { code: 'T', name: 'Actividades de los hogares como empleadores' },
  { code: 'U', name: 'Actividades de organizaciones y organos extraterritoriales' },
];

// ---- Divisiones por seccion (todas las 88 divisiones ISIC Rev.4) -----------

export const CIIU_DIVISIONES: Record<string, CiiuDivision[]> = {
  A: [
    { code: '01', name: 'Agricultura, ganaderia, caza y actividades de servicios conexas' },
    { code: '02', name: 'Silvicultura y extraccion de madera' },
    { code: '03', name: 'Pesca y acuicultura' },
  ],
  B: [
    { code: '05', name: 'Extraccion de carbon de piedra y lignito' },
    { code: '06', name: 'Extraccion de petroleo crudo y gas natural' },
    { code: '07', name: 'Extraccion de minerales metaliferos' },
    { code: '08', name: 'Explotacion de otras minas y canteras' },
    { code: '09', name: 'Actividades de servicios de apoyo para la explotacion de minas y canteras' },
  ],
  C: [
    { code: '10', name: 'Elaboracion de productos alimenticios' },
    { code: '11', name: 'Elaboracion de bebidas' },
    { code: '12', name: 'Elaboracion de productos de tabaco' },
    { code: '13', name: 'Fabricacion de productos textiles' },
    { code: '14', name: 'Fabricacion de prendas de vestir' },
    { code: '15', name: 'Fabricacion de cueros y productos conexos' },
    { code: '16', name: 'Produccion de madera y fabricacion de productos de madera y corcho' },
    { code: '17', name: 'Fabricacion de papel y de productos de papel' },
    { code: '18', name: 'Impresion y reproduccion de grabaciones' },
    { code: '19', name: 'Fabricacion de coque y de productos de la refinacion del petroleo' },
    { code: '20', name: 'Fabricacion de sustancias y productos quimicos' },
    { code: '21', name: 'Fabricacion de productos farmaceuticos y preparaciones farmaceuticas' },
    { code: '22', name: 'Fabricacion de productos de caucho y de plastico' },
    { code: '23', name: 'Fabricacion de otros productos minerales no metalicos' },
    { code: '24', name: 'Fabricacion de metales comunes' },
    { code: '25', name: 'Fabricacion de productos elaborados de metal, excepto maquinaria y equipo' },
    { code: '26', name: 'Fabricacion de productos de informatica, de electronica y de optica' },
    { code: '27', name: 'Fabricacion de equipo electrico' },
    { code: '28', name: 'Fabricacion de maquinaria y equipo n.c.p.' },
    { code: '29', name: 'Fabricacion de vehiculos automotores, remolques y semirremolques' },
    { code: '30', name: 'Fabricacion de otro equipo de transporte' },
    { code: '31', name: 'Fabricacion de muebles' },
    { code: '32', name: 'Otras industrias manufactureras' },
    { code: '33', name: 'Reparacion e instalacion de maquinaria y equipo' },
  ],
  D: [
    { code: '35', name: 'Suministro de electricidad, gas, vapor y aire acondicionado' },
  ],
  E: [
    { code: '36', name: 'Captacion, tratamiento y distribucion de agua' },
    { code: '37', name: 'Evacuacion de aguas residuales' },
    { code: '38', name: 'Recogida, tratamiento y eliminacion de desechos; recuperacion de materiales' },
    { code: '39', name: 'Actividades de descontaminacion y otros servicios de gestion de desechos' },
  ],
  F: [
    { code: '41', name: 'Construccion de edificios' },
    { code: '42', name: 'Obras de ingenieria civil' },
    { code: '43', name: 'Actividades especializadas de construccion' },
  ],
  G: [
    { code: '45', name: 'Comercio al por mayor y al por menor y reparacion de vehiculos automotores y motocicletas' },
    { code: '46', name: 'Comercio al por mayor, excepto el de vehiculos automotores y motocicletas' },
    { code: '47', name: 'Comercio al por menor, excepto el de vehiculos automotores y motocicletas' },
  ],
  H: [
    { code: '49', name: 'Transporte por via terrestre y transporte por tuberias' },
    { code: '50', name: 'Transporte por via acuatica' },
    { code: '51', name: 'Transporte por via aerea' },
    { code: '52', name: 'Almacenamiento y actividades de apoyo al transporte' },
    { code: '53', name: 'Actividades postales y de mensajeria' },
  ],
  I: [
    { code: '55', name: 'Alojamiento' },
    { code: '56', name: 'Actividades de servicio de comidas y bebidas' },
  ],
  J: [
    { code: '58', name: 'Actividades de edicion' },
    { code: '59', name: 'Actividades de produccion de peliculas cinematograficas, videos y programas de television, grabacion de sonido y edicion de musica' },
    { code: '60', name: 'Actividades de programacion y transmision' },
    { code: '61', name: 'Telecomunicaciones' },
    { code: '62', name: 'Programacion informatica, consultoria de informatica y actividades conexas' },
    { code: '63', name: 'Actividades de servicios de informacion' },
  ],
  K: [
    { code: '64', name: 'Actividades de servicios financieros, excepto las de seguros y fondos de pensiones' },
    { code: '65', name: 'Seguros, reaseguros y fondos de pensiones, excepto los planes de seguridad social de afiliacion obligatoria' },
    { code: '66', name: 'Actividades auxiliares de las actividades de servicios financieros' },
  ],
  L: [
    { code: '68', name: 'Actividades inmobiliarias' },
  ],
  M: [
    { code: '69', name: 'Actividades juridicas y de contabilidad' },
    { code: '70', name: 'Actividades de oficinas principales; actividades de consultoria de gestion' },
    { code: '71', name: 'Actividades de arquitectura e ingenieria; ensayos y analisis tecnicos' },
    { code: '72', name: 'Investigacion cientifica y desarrollo' },
    { code: '73', name: 'Publicidad e investigacion de mercados' },
    { code: '74', name: 'Otras actividades profesionales, cientificas y tecnicas' },
    { code: '75', name: 'Actividades veterinarias' },
  ],
  N: [
    { code: '77', name: 'Actividades de alquiler y arrendamiento' },
    { code: '78', name: 'Actividades de empleo' },
    { code: '79', name: 'Actividades de agencias de viajes y operadores turisticos y servicios de reservas' },
    { code: '80', name: 'Actividades de seguridad e investigacion' },
    { code: '81', name: 'Actividades de servicios a edificios y de paisajismo' },
    { code: '82', name: 'Actividades administrativas y de apoyo de oficina y otras actividades de apoyo a las empresas' },
  ],
  O: [
    { code: '84', name: 'Administracion publica y defensa; planes de seguridad social de afiliacion obligatoria' },
  ],
  P: [
    { code: '85', name: 'Ensenanza' },
  ],
  Q: [
    { code: '86', name: 'Actividades de atencion de la salud humana' },
    { code: '87', name: 'Actividades de atencion en instituciones' },
    { code: '88', name: 'Actividades de asistencia social sin alojamiento' },
  ],
  R: [
    { code: '90', name: 'Actividades creativas, artisticas y de entretenimiento' },
    { code: '91', name: 'Actividades de bibliotecas, archivos, museos y otras actividades culturales' },
    { code: '92', name: 'Actividades de juegos de azar y apuestas' },
    { code: '93', name: 'Actividades deportivas, de esparcimiento y recreativas' },
  ],
  S: [
    { code: '94', name: 'Actividades de asociaciones' },
    { code: '95', name: 'Reparacion de computadores y de efectos personales y enseres domesticos' },
    { code: '96', name: 'Otras actividades de servicios personales' },
  ],
  T: [
    { code: '97', name: 'Actividades de los hogares como empleadores de personal domestico' },
    { code: '98', name: 'Actividades no diferenciadas de los hogares como productores de bienes y servicios para uso propio' },
  ],
  U: [
    { code: '99', name: 'Actividades de organizaciones y organos extraterritoriales' },
  ],
};

// ---- Grupos por division (todos los ~238 grupos ISIC Rev.4) -----------------
// Clave: codigo de division (2 digitos)

export const CIIU_GRUPOS: Record<string, CiiuGrupo[]> = {
  // === SECCION A: Agricultura, ganaderia, silvicultura y pesca ===
  '01': [
    { code: '011', name: 'Cultivo de plantas no perennes' },
    { code: '012', name: 'Cultivo de plantas perennes' },
    { code: '013', name: 'Propagacion de plantas' },
    { code: '014', name: 'Ganaderia' },
    { code: '015', name: 'Explotacion mixta' },
    { code: '016', name: 'Actividades de apoyo a la agricultura y la ganaderia y actividades poscosecha' },
    { code: '017', name: 'Caza ordinaria y mediante trampas y actividades de servicios conexas' },
  ],
  '02': [
    { code: '021', name: 'Silvicultura y otras actividades forestales' },
    { code: '022', name: 'Extraccion de madera' },
    { code: '023', name: 'Recoleccion de productos forestales distintos de la madera' },
    { code: '024', name: 'Servicios de apoyo a la silvicultura' },
  ],
  '03': [
    { code: '031', name: 'Pesca' },
    { code: '032', name: 'Acuicultura' },
  ],

  // === SECCION B: Explotacion de minas y canteras ===
  '05': [
    { code: '051', name: 'Extraccion de carbon de piedra' },
    { code: '052', name: 'Extraccion de lignito' },
  ],
  '06': [
    { code: '061', name: 'Extraccion de petroleo crudo' },
    { code: '062', name: 'Extraccion de gas natural' },
  ],
  '07': [
    { code: '071', name: 'Extraccion de minerales de hierro' },
    { code: '072', name: 'Extraccion de minerales metaliferos no ferrosos' },
  ],
  '08': [
    { code: '081', name: 'Extraccion de piedra, arena y arcilla' },
    { code: '089', name: 'Explotacion de minas y canteras n.c.p.' },
  ],
  '09': [
    { code: '091', name: 'Actividades de apoyo para la extraccion de petroleo y gas natural' },
    { code: '099', name: 'Actividades de apoyo para otras actividades de explotacion de minas y canteras' },
  ],

  // === SECCION C: Industrias manufactureras ===
  '10': [
    { code: '101', name: 'Elaboracion y conservacion de carne' },
    { code: '102', name: 'Elaboracion y conservacion de pescado, crustaceos y moluscos' },
    { code: '103', name: 'Elaboracion y conservacion de frutas, legumbres y hortalizas' },
    { code: '104', name: 'Elaboracion de aceites y grasas de origen vegetal y animal' },
    { code: '105', name: 'Elaboracion de productos lacteos' },
    { code: '106', name: 'Elaboracion de productos de molineria, almidones y productos derivados del almidon' },
    { code: '107', name: 'Elaboracion de otros productos alimenticios' },
    { code: '108', name: 'Elaboracion de piensos preparados para animales' },
  ],
  '11': [
    { code: '110', name: 'Elaboracion de bebidas' },
  ],
  '12': [
    { code: '120', name: 'Elaboracion de productos de tabaco' },
  ],
  '13': [
    { code: '131', name: 'Hilatura, tejedura y acabado de productos textiles' },
    { code: '139', name: 'Fabricacion de otros productos textiles' },
  ],
  '14': [
    { code: '141', name: 'Fabricacion de prendas de vestir, excepto prendas de piel' },
    { code: '142', name: 'Fabricacion de articulos de piel' },
    { code: '143', name: 'Fabricacion de tejidos de punto y ganchillo' },
  ],
  '15': [
    { code: '151', name: 'Curtido y adobo de cueros; fabricacion de maletas, bolsos de mano y articulos de talabarteria y guarnicioneria; adobo y tenido de pieles' },
    { code: '152', name: 'Fabricacion de calzado' },
  ],
  '16': [
    { code: '161', name: 'Aserrado y acepilladura de madera' },
    { code: '162', name: 'Fabricacion de productos de madera, corcho, paja y materiales trenzables' },
  ],
  '17': [
    { code: '170', name: 'Fabricacion de papel y de productos de papel' },
  ],
  '18': [
    { code: '181', name: 'Impresion y actividades de servicios relacionadas con la impresion' },
    { code: '182', name: 'Reproduccion de grabaciones' },
  ],
  '19': [
    { code: '191', name: 'Fabricacion de productos de hornos de coque' },
    { code: '192', name: 'Fabricacion de productos de la refinacion del petroleo' },
  ],
  '20': [
    { code: '201', name: 'Fabricacion de sustancias quimicas basicas, de abonos y compuestos de nitrogeno y de plasticos y caucho sintetico en formas primarias' },
    { code: '202', name: 'Fabricacion de otros productos quimicos' },
    { code: '203', name: 'Fabricacion de fibras artificiales' },
  ],
  '21': [
    { code: '210', name: 'Fabricacion de productos farmaceuticos, sustancias quimicas medicinales y productos botanicos de uso farmaceutico' },
  ],
  '22': [
    { code: '221', name: 'Fabricacion de productos de caucho' },
    { code: '222', name: 'Fabricacion de productos de plastico' },
  ],
  '23': [
    { code: '231', name: 'Fabricacion de vidrio y productos de vidrio' },
    { code: '239', name: 'Fabricacion de productos minerales no metalicos n.c.p.' },
  ],
  '24': [
    { code: '241', name: 'Industrias basicas de hierro y acero' },
    { code: '242', name: 'Fabricacion de productos primarios de metales preciosos y otros metales no ferrosos' },
    { code: '243', name: 'Fundicion de metales' },
  ],
  '25': [
    { code: '251', name: 'Fabricacion de productos metalicos para uso estructural, tanques, depositos y recipientes de metal' },
    { code: '252', name: 'Fabricacion de armas y municiones' },
    { code: '259', name: 'Fabricacion de otros productos elaborados de metal; actividades de servicios de trabajo de metales' },
  ],
  '26': [
    { code: '261', name: 'Fabricacion de componentes y tableros electronicos' },
    { code: '262', name: 'Fabricacion de ordenadores y equipo periferico' },
    { code: '263', name: 'Fabricacion de equipo de comunicaciones' },
    { code: '264', name: 'Fabricacion de aparatos electronicos de consumo' },
    { code: '265', name: 'Fabricacion de equipo de medicion, prueba, navegacion y control; fabricacion de relojes' },
    { code: '266', name: 'Fabricacion de equipo de irradiacion y equipo electronico de uso medico y terapeutico' },
    { code: '267', name: 'Fabricacion de instrumentos opticos y equipo fotografico' },
    { code: '268', name: 'Fabricacion de soportes magneticos y opticos' },
  ],
  '27': [
    { code: '271', name: 'Fabricacion de motores, generadores, transformadores electricos y aparatos de distribucion y control de la energia electrica' },
    { code: '272', name: 'Fabricacion de pilas, baterias y acumuladores' },
    { code: '273', name: 'Fabricacion de cables y dispositivos de cableado' },
    { code: '274', name: 'Fabricacion de equipo electrico de iluminacion' },
    { code: '275', name: 'Fabricacion de aparatos de uso domestico' },
    { code: '279', name: 'Fabricacion de otros tipos de equipo electrico' },
  ],
  '28': [
    { code: '281', name: 'Fabricacion de maquinaria de uso general' },
    { code: '282', name: 'Fabricacion de maquinaria de uso especial' },
  ],
  '29': [
    { code: '291', name: 'Fabricacion de vehiculos automotores' },
    { code: '292', name: 'Fabricacion de carrocerias para vehiculos automotores; fabricacion de remolques y semirremolques' },
    { code: '293', name: 'Fabricacion de partes, piezas y accesorios para vehiculos automotores' },
  ],
  '30': [
    { code: '301', name: 'Construccion de buques y otras embarcaciones' },
    { code: '302', name: 'Fabricacion de locomotoras y material rodante' },
    { code: '303', name: 'Fabricacion de aeronaves y naves espaciales y maquinaria conexa' },
    { code: '304', name: 'Fabricacion de vehiculos militares de combate' },
    { code: '309', name: 'Fabricacion de equipo de transporte n.c.p.' },
  ],
  '31': [
    { code: '310', name: 'Fabricacion de muebles' },
  ],
  '32': [
    { code: '321', name: 'Fabricacion de joyas, bisuteria y articulos conexos' },
    { code: '322', name: 'Fabricacion de instrumentos de musica' },
    { code: '323', name: 'Fabricacion de articulos de deporte' },
    { code: '324', name: 'Fabricacion de juegos y juguetes' },
    { code: '325', name: 'Fabricacion de instrumentos y materiales medicos y odontologicos' },
    { code: '329', name: 'Otras industrias manufactureras n.c.p.' },
  ],
  '33': [
    { code: '331', name: 'Reparacion de productos elaborados de metal, maquinaria y equipo' },
    { code: '332', name: 'Instalacion de maquinaria y equipo industriales' },
  ],

  // === SECCION D: Suministro de electricidad, gas, vapor y aire acondicionado ===
  '35': [
    { code: '351', name: 'Generacion, transmision y distribucion de energia electrica' },
    { code: '352', name: 'Fabricacion de gas; distribucion de combustibles gaseosos por tuberias' },
    { code: '353', name: 'Suministro de vapor y de aire acondicionado' },
  ],

  // === SECCION E: Suministro de agua; evacuacion de aguas residuales ===
  '36': [
    { code: '360', name: 'Captacion, tratamiento y distribucion de agua' },
  ],
  '37': [
    { code: '370', name: 'Evacuacion de aguas residuales' },
  ],
  '38': [
    { code: '381', name: 'Recogida de desechos' },
    { code: '382', name: 'Tratamiento y eliminacion de desechos' },
    { code: '383', name: 'Recuperacion de materiales' },
  ],
  '39': [
    { code: '390', name: 'Actividades de descontaminacion y otros servicios de gestion de desechos' },
  ],

  // === SECCION F: Construccion ===
  '41': [
    { code: '410', name: 'Construccion de edificios' },
  ],
  '42': [
    { code: '421', name: 'Construccion de carreteras y lineas de ferrocarril' },
    { code: '422', name: 'Construccion de proyectos de servicio publico' },
    { code: '429', name: 'Construccion de otras obras de ingenieria civil' },
  ],
  '43': [
    { code: '431', name: 'Demolicion y preparacion del terreno' },
    { code: '432', name: 'Instalaciones electricas y de fontaneria y otras instalaciones para obras de construccion' },
    { code: '433', name: 'Terminacion y acabado de edificios' },
    { code: '439', name: 'Otras actividades especializadas de construccion' },
  ],

  // === SECCION G: Comercio al por mayor y al por menor ===
  '45': [
    { code: '451', name: 'Venta de vehiculos automotores' },
    { code: '452', name: 'Mantenimiento y reparacion de vehiculos automotores' },
    { code: '453', name: 'Venta de partes, piezas y accesorios para vehiculos automotores' },
    { code: '454', name: 'Venta, mantenimiento y reparacion de motocicletas y de sus partes, piezas y accesorios' },
  ],
  '46': [
    { code: '461', name: 'Venta al por mayor a cambio de una retribucion o por contrata' },
    { code: '462', name: 'Venta al por mayor de materias primas agropecuarias y animales vivos' },
    { code: '463', name: 'Venta al por mayor de alimentos, bebidas y tabaco' },
    { code: '464', name: 'Venta al por mayor de enseres domesticos' },
    { code: '465', name: 'Venta al por mayor de maquinaria, equipo y materiales' },
    { code: '466', name: 'Otras actividades de venta al por mayor especializada' },
    { code: '469', name: 'Venta al por mayor no especializada' },
  ],
  '47': [
    { code: '471', name: 'Venta al por menor en comercios no especializados' },
    { code: '472', name: 'Venta al por menor de alimentos, bebidas y tabaco en comercios especializados' },
    { code: '473', name: 'Venta al por menor de combustibles para vehiculos automotores en comercios especializados' },
    { code: '474', name: 'Venta al por menor de equipo de informacion y de comunicaciones en comercios especializados' },
    { code: '475', name: 'Venta al por menor de otros enseres domesticos en comercios especializados' },
    { code: '476', name: 'Venta al por menor de productos culturales y recreativos en comercios especializados' },
    { code: '477', name: 'Venta al por menor de otros productos en comercios especializados' },
    { code: '478', name: 'Venta al por menor en puestos de venta y mercados' },
    { code: '479', name: 'Venta al por menor no realizada en comercios, puestos de venta ni mercados' },
  ],

  // === SECCION H: Transporte y almacenamiento ===
  '49': [
    { code: '491', name: 'Transporte por ferrocarril' },
    { code: '492', name: 'Otras actividades de transporte por via terrestre' },
    { code: '493', name: 'Transporte por tuberias' },
  ],
  '50': [
    { code: '501', name: 'Transporte maritimo y de cabotaje' },
    { code: '502', name: 'Transporte por vias de navegacion interiores' },
  ],
  '51': [
    { code: '511', name: 'Transporte de pasajeros por via aerea' },
    { code: '512', name: 'Transporte de carga por via aerea' },
  ],
  '52': [
    { code: '521', name: 'Almacenamiento y deposito' },
    { code: '522', name: 'Actividades de apoyo al transporte' },
  ],
  '53': [
    { code: '531', name: 'Actividades postales' },
    { code: '532', name: 'Actividades de mensajeria' },
  ],

  // === SECCION I: Alojamiento y servicios de comida ===
  '55': [
    { code: '551', name: 'Actividades de alojamiento para estancias cortas' },
    { code: '552', name: 'Actividades de campamentos, parques de vehiculos recreativos y parques de caravanas' },
    { code: '559', name: 'Otras actividades de alojamiento' },
  ],
  '56': [
    { code: '561', name: 'Actividades de restaurantes y de servicio movil de comidas' },
    { code: '562', name: 'Suministro de comidas por encargo y otras actividades de servicio de comidas' },
    { code: '563', name: 'Actividades de servicio de bebidas' },
  ],

  // === SECCION J: Informacion y comunicaciones ===
  '58': [
    { code: '581', name: 'Edicion de libros, periodicos y otras actividades de edicion' },
    { code: '582', name: 'Edicion de programas de informatica' },
  ],
  '59': [
    { code: '591', name: 'Actividades de produccion de peliculas cinematograficas, videos y programas de television' },
    { code: '592', name: 'Actividades de grabacion de sonido y edicion de musica' },
  ],
  '60': [
    { code: '601', name: 'Transmisiones de radio' },
    { code: '602', name: 'Programacion y transmisiones de television' },
  ],
  '61': [
    { code: '611', name: 'Actividades de telecomunicaciones alambricas' },
    { code: '612', name: 'Actividades de telecomunicaciones inalambricas' },
    { code: '613', name: 'Actividades de telecomunicaciones por satelite' },
    { code: '619', name: 'Otras actividades de telecomunicaciones' },
  ],
  '62': [
    { code: '620', name: 'Programacion informatica, consultoria de informatica y actividades conexas' },
  ],
  '63': [
    { code: '631', name: 'Procesamiento de datos, hospedaje y actividades conexas; portales web' },
    { code: '639', name: 'Otras actividades de servicios de informacion' },
  ],

  // === SECCION K: Actividades financieras y de seguros ===
  '64': [
    { code: '641', name: 'Intermediacion monetaria' },
    { code: '642', name: 'Actividades de sociedades de cartera' },
    { code: '643', name: 'Fondos y sociedades de inversion y entidades financieras similares' },
    { code: '649', name: 'Otras actividades de servicios financieros, excepto las de seguros y fondos de pensiones' },
  ],
  '65': [
    { code: '651', name: 'Seguros' },
    { code: '652', name: 'Reaseguros' },
    { code: '653', name: 'Fondos de pensiones' },
  ],
  '66': [
    { code: '661', name: 'Actividades auxiliares de las actividades de servicios financieros, excepto las de seguros y fondos de pensiones' },
    { code: '662', name: 'Actividades auxiliares de las actividades de seguros y fondos de pensiones' },
    { code: '663', name: 'Actividades de gestion de fondos' },
  ],

  // === SECCION L: Actividades inmobiliarias ===
  '68': [
    { code: '681', name: 'Actividades inmobiliarias realizadas con bienes propios o arrendados' },
    { code: '682', name: 'Actividades inmobiliarias realizadas a cambio de una retribucion o por contrata' },
  ],

  // === SECCION M: Actividades profesionales, cientificas y tecnicas ===
  '69': [
    { code: '691', name: 'Actividades juridicas' },
    { code: '692', name: 'Actividades de contabilidad, teneduria de libros y auditoria; consultoria fiscal' },
  ],
  '70': [
    { code: '701', name: 'Actividades de oficinas principales' },
    { code: '702', name: 'Actividades de consultoria de gestion' },
  ],
  '71': [
    { code: '711', name: 'Actividades de arquitectura e ingenieria y actividades conexas de consultoria tecnica' },
    { code: '712', name: 'Ensayos y analisis tecnicos' },
  ],
  '72': [
    { code: '721', name: 'Investigaciones y desarrollo experimental en el campo de las ciencias naturales y la ingenieria' },
    { code: '722', name: 'Investigaciones y desarrollo experimental en el campo de las ciencias sociales y las humanidades' },
  ],
  '73': [
    { code: '731', name: 'Publicidad' },
    { code: '732', name: 'Estudios de mercado y encuestas de opinion publica' },
  ],
  '74': [
    { code: '741', name: 'Actividades de diseno especializado' },
    { code: '742', name: 'Actividades de fotografia' },
    { code: '749', name: 'Otras actividades profesionales, cientificas y tecnicas n.c.p.' },
  ],
  '75': [
    { code: '750', name: 'Actividades veterinarias' },
  ],

  // === SECCION N: Actividades de servicios administrativos y de apoyo ===
  '77': [
    { code: '771', name: 'Alquiler y arrendamiento de vehiculos automotores' },
    { code: '772', name: 'Alquiler y arrendamiento de efectos personales y enseres domesticos' },
    { code: '773', name: 'Alquiler y arrendamiento de otros tipos de maquinaria, equipo y bienes tangibles' },
    { code: '774', name: 'Arrendamiento de propiedad intelectual y productos similares, excepto obras protegidas por derechos de autor' },
  ],
  '78': [
    { code: '781', name: 'Actividades de agencias de empleo' },
    { code: '782', name: 'Actividades de agencias de empleo temporal' },
    { code: '783', name: 'Otras actividades de dotacion de recursos humanos' },
  ],
  '79': [
    { code: '791', name: 'Actividades de agencias de viajes y operadores turisticos' },
    { code: '799', name: 'Otros servicios de reservas y actividades conexas' },
  ],
  '80': [
    { code: '801', name: 'Actividades de seguridad privada' },
    { code: '802', name: 'Actividades de servicios de sistemas de seguridad' },
    { code: '803', name: 'Actividades de investigacion' },
  ],
  '81': [
    { code: '811', name: 'Actividades combinadas de apoyo a instalaciones' },
    { code: '812', name: 'Actividades de limpieza' },
    { code: '813', name: 'Actividades de paisajismo y servicios de mantenimiento conexos' },
  ],
  '82': [
    { code: '821', name: 'Actividades administrativas y de apoyo de oficina' },
    { code: '822', name: 'Actividades de centros de llamadas' },
    { code: '823', name: 'Organizacion de convenciones y exposiciones comerciales' },
    { code: '829', name: 'Actividades de servicios de apoyo a las empresas n.c.p.' },
  ],

  // === SECCION O: Administracion publica y defensa ===
  '84': [
    { code: '841', name: 'Administracion del Estado y aplicacion de la politica economica y social de la comunidad' },
    { code: '842', name: 'Prestacion de servicios a la comunidad en general' },
    { code: '843', name: 'Actividades de planes de seguridad social de afiliacion obligatoria' },
  ],

  // === SECCION P: Ensenanza ===
  '85': [
    { code: '851', name: 'Ensenanza preescolar y primaria' },
    { code: '852', name: 'Ensenanza secundaria' },
    { code: '853', name: 'Ensenanza superior' },
    { code: '854', name: 'Otros tipos de ensenanza' },
    { code: '855', name: 'Actividades de apoyo a la ensenanza' },
  ],

  // === SECCION Q: Actividades de atencion de la salud humana ===
  '86': [
    { code: '861', name: 'Actividades de hospitales' },
    { code: '862', name: 'Actividades de medicos y odontologos' },
    { code: '869', name: 'Otras actividades de atencion de la salud humana' },
  ],
  '87': [
    { code: '871', name: 'Actividades de atencion de enfermeria en instituciones' },
    { code: '872', name: 'Actividades de atencion en instituciones para personas con retraso mental, enfermos mentales y toxicomanos' },
    { code: '873', name: 'Actividades de atencion en instituciones para personas de edad y personas con discapacidad' },
    { code: '879', name: 'Otras actividades de atencion en instituciones' },
  ],
  '88': [
    { code: '881', name: 'Actividades de asistencia social sin alojamiento para personas de edad y personas con discapacidad' },
    { code: '889', name: 'Otras actividades de asistencia social sin alojamiento' },
  ],

  // === SECCION R: Actividades artisticas, de entretenimiento y recreativas ===
  '90': [
    { code: '900', name: 'Actividades creativas, artisticas y de entretenimiento' },
  ],
  '91': [
    { code: '910', name: 'Actividades de bibliotecas, archivos, museos y otras actividades culturales' },
  ],
  '92': [
    { code: '920', name: 'Actividades de juegos de azar y apuestas' },
  ],
  '93': [
    { code: '931', name: 'Actividades deportivas' },
    { code: '932', name: 'Otras actividades de esparcimiento y recreativas' },
  ],

  // === SECCION S: Otras actividades de servicios ===
  '94': [
    { code: '941', name: 'Actividades de asociaciones empresariales, profesionales y de empleadores' },
    { code: '942', name: 'Actividades de sindicatos' },
    { code: '949', name: 'Actividades de otras asociaciones' },
  ],
  '95': [
    { code: '951', name: 'Reparacion de ordenadores y equipo de comunicaciones' },
    { code: '952', name: 'Reparacion de efectos personales y enseres domesticos' },
  ],
  '96': [
    { code: '960', name: 'Otras actividades de servicios personales' },
  ],

  // === SECCION T: Actividades de los hogares como empleadores ===
  '97': [
    { code: '970', name: 'Actividades de los hogares como empleadores de personal domestico' },
  ],
  '98': [
    { code: '981', name: 'Actividades no diferenciadas de los hogares como productores de bienes para uso propio' },
    { code: '982', name: 'Actividades no diferenciadas de los hogares como productores de servicios para uso propio' },
  ],

  // === SECCION U: Actividades de organizaciones y organos extraterritoriales ===
  '99': [
    { code: '990', name: 'Actividades de organizaciones y organos extraterritoriales' },
  ],
};

// ---- Clases por grupo (todas las ~419 clases ISIC Rev.4) --------------------
// Clave: codigo de grupo (3 digitos)

export const CIIU_CLASES: Record<string, CiiuClase[]> = {
  // === SECCION A: Agricultura, ganaderia, silvicultura y pesca ===

  // Division 01: Agricultura, ganaderia, caza
  '011': [
    { code: '0111', name: 'Cultivo de cereales (excepto arroz), legumbres y semillas oleaginosas' },
    { code: '0112', name: 'Cultivo de arroz' },
    { code: '0113', name: 'Cultivo de hortalizas y melones, raices y tuberculos' },
    { code: '0114', name: 'Cultivo de cana de azucar' },
    { code: '0115', name: 'Cultivo de tabaco' },
    { code: '0116', name: 'Cultivo de plantas de fibra' },
    { code: '0119', name: 'Cultivo de otras plantas no perennes' },
  ],
  '012': [
    { code: '0121', name: 'Cultivo de uva' },
    { code: '0122', name: 'Cultivo de frutas tropicales y subtropicales' },
    { code: '0123', name: 'Cultivo de citricos' },
    { code: '0124', name: 'Cultivo de frutas con pepita y con hueso' },
    { code: '0125', name: 'Cultivo de otros frutos y nueces de arboles y arbustos' },
    { code: '0126', name: 'Cultivo de frutos oleaginosos' },
    { code: '0127', name: 'Cultivo de plantas con las que se preparan bebidas' },
    { code: '0128', name: 'Cultivo de especias, plantas aromaticas, medicinales y farmaceuticas' },
    { code: '0129', name: 'Cultivo de otras plantas perennes' },
  ],
  '013': [
    { code: '0130', name: 'Propagacion de plantas' },
  ],
  '014': [
    { code: '0141', name: 'Cria de ganado bovino y bufalos' },
    { code: '0142', name: 'Cria de caballos y otros equinos' },
    { code: '0143', name: 'Cria de camellos y camelidos' },
    { code: '0144', name: 'Cria de ovejas y cabras' },
    { code: '0145', name: 'Cria de cerdos' },
    { code: '0146', name: 'Cria de aves de corral' },
    { code: '0149', name: 'Cria de otros animales' },
  ],
  '015': [
    { code: '0150', name: 'Explotacion mixta' },
  ],
  '016': [
    { code: '0161', name: 'Actividades de apoyo a la agricultura' },
    { code: '0162', name: 'Actividades de apoyo a la ganaderia' },
    { code: '0163', name: 'Actividades poscosecha' },
    { code: '0164', name: 'Tratamiento de semillas para propagacion' },
  ],
  '017': [
    { code: '0170', name: 'Caza ordinaria y mediante trampas y actividades de servicios conexas' },
  ],

  // Division 02: Silvicultura y extraccion de madera
  '021': [
    { code: '0210', name: 'Silvicultura y otras actividades forestales' },
  ],
  '022': [
    { code: '0220', name: 'Extraccion de madera' },
  ],
  '023': [
    { code: '0230', name: 'Recoleccion de productos forestales distintos de la madera' },
  ],
  '024': [
    { code: '0240', name: 'Servicios de apoyo a la silvicultura' },
  ],

  // Division 03: Pesca y acuicultura
  '031': [
    { code: '0311', name: 'Pesca maritima' },
    { code: '0312', name: 'Pesca de agua dulce' },
  ],
  '032': [
    { code: '0321', name: 'Acuicultura maritima' },
    { code: '0322', name: 'Acuicultura de agua dulce' },
  ],

  // === SECCION B: Explotacion de minas y canteras ===

  // Division 05: Extraccion de carbon de piedra y lignito
  '051': [
    { code: '0510', name: 'Extraccion de carbon de piedra' },
  ],
  '052': [
    { code: '0520', name: 'Extraccion de lignito' },
  ],

  // Division 06: Extraccion de petroleo crudo y gas natural
  '061': [
    { code: '0610', name: 'Extraccion de petroleo crudo' },
  ],
  '062': [
    { code: '0620', name: 'Extraccion de gas natural' },
  ],

  // Division 07: Extraccion de minerales metaliferos
  '071': [
    { code: '0710', name: 'Extraccion de minerales de hierro' },
  ],
  '072': [
    { code: '0721', name: 'Extraccion de minerales de uranio y torio' },
    { code: '0729', name: 'Extraccion de otros minerales metaliferos no ferrosos' },
  ],

  // Division 08: Explotacion de otras minas y canteras
  '081': [
    { code: '0810', name: 'Extraccion de piedra, arena y arcilla' },
  ],
  '089': [
    { code: '0891', name: 'Extraccion de minerales para la fabricacion de abonos y productos quimicos' },
    { code: '0892', name: 'Extraccion de turba' },
    { code: '0893', name: 'Extraccion de sal' },
    { code: '0899', name: 'Explotacion de otras minas y canteras n.c.p.' },
  ],

  // Division 09: Actividades de servicios de apoyo
  '091': [
    { code: '0910', name: 'Actividades de apoyo para la extraccion de petroleo y gas natural' },
  ],
  '099': [
    { code: '0990', name: 'Actividades de apoyo para otras actividades de explotacion de minas y canteras' },
  ],

  // === SECCION C: Industrias manufactureras ===

  // Division 10: Elaboracion de productos alimenticios
  '101': [
    { code: '1010', name: 'Elaboracion y conservacion de carne' },
  ],
  '102': [
    { code: '1020', name: 'Elaboracion y conservacion de pescado, crustaceos y moluscos' },
  ],
  '103': [
    { code: '1030', name: 'Elaboracion y conservacion de frutas, legumbres y hortalizas' },
  ],
  '104': [
    { code: '1040', name: 'Elaboracion de aceites y grasas de origen vegetal y animal' },
  ],
  '105': [
    { code: '1050', name: 'Elaboracion de productos lacteos' },
  ],
  '106': [
    { code: '1061', name: 'Elaboracion de productos de molineria' },
    { code: '1062', name: 'Elaboracion de almidones y productos derivados del almidon' },
  ],
  '107': [
    { code: '1071', name: 'Elaboracion de productos de panaderia' },
    { code: '1072', name: 'Elaboracion de azucar' },
    { code: '1073', name: 'Elaboracion de cacao y chocolate y de productos de confiteria' },
    { code: '1074', name: 'Elaboracion de macarrones, fideos, alcuzcuz y productos farinaceos similares' },
    { code: '1075', name: 'Elaboracion de comidas y platos preparados' },
    { code: '1079', name: 'Elaboracion de otros productos alimenticios n.c.p.' },
  ],
  '108': [
    { code: '1080', name: 'Elaboracion de piensos preparados para animales' },
  ],

  // Division 11: Elaboracion de bebidas
  '110': [
    { code: '1101', name: 'Destilacion, rectificacion y mezcla de bebidas alcoholicas' },
    { code: '1102', name: 'Elaboracion de vinos' },
    { code: '1103', name: 'Elaboracion de bebidas de malta y de malta' },
    { code: '1104', name: 'Elaboracion de bebidas no alcoholicas; produccion de aguas minerales y otras aguas embotelladas' },
  ],

  // Division 12: Elaboracion de productos de tabaco
  '120': [
    { code: '1200', name: 'Elaboracion de productos de tabaco' },
  ],

  // Division 13: Fabricacion de productos textiles
  '131': [
    { code: '1311', name: 'Preparacion e hilatura de fibras textiles' },
    { code: '1312', name: 'Tejedura de productos textiles' },
    { code: '1313', name: 'Acabado de productos textiles' },
  ],
  '139': [
    { code: '1391', name: 'Fabricacion de tejidos de punto y ganchillo' },
    { code: '1392', name: 'Fabricacion de articulos confeccionados de materiales textiles, excepto prendas de vestir' },
    { code: '1393', name: 'Fabricacion de tapices y alfombras' },
    { code: '1394', name: 'Fabricacion de cuerdas, cordeles, bramantes y redes' },
    { code: '1399', name: 'Fabricacion de otros productos textiles n.c.p.' },
  ],

  // Division 14: Fabricacion de prendas de vestir
  '141': [
    { code: '1410', name: 'Fabricacion de prendas de vestir, excepto prendas de piel' },
  ],
  '142': [
    { code: '1420', name: 'Fabricacion de articulos de piel' },
  ],
  '143': [
    { code: '1430', name: 'Fabricacion de tejidos de punto y ganchillo' },
  ],

  // Division 15: Fabricacion de cueros y productos conexos
  '151': [
    { code: '1511', name: 'Curtido y adobo de cueros; adobo y tenido de pieles' },
    { code: '1512', name: 'Fabricacion de maletas, bolsos de mano y articulos similares, y de articulos de talabarteria y guarnicioneria' },
  ],
  '152': [
    { code: '1520', name: 'Fabricacion de calzado' },
  ],

  // Division 16: Produccion de madera
  '161': [
    { code: '1610', name: 'Aserrado y acepilladura de madera' },
  ],
  '162': [
    { code: '1621', name: 'Fabricacion de hojas de madera para enchapado y tableros a base de madera' },
    { code: '1622', name: 'Fabricacion de partes y piezas de carpinteria para edificios y construcciones' },
    { code: '1623', name: 'Fabricacion de recipientes de madera' },
    { code: '1629', name: 'Fabricacion de otros productos de madera; fabricacion de articulos de corcho, paja y materiales trenzables' },
  ],

  // Division 17: Fabricacion de papel y de productos de papel
  '170': [
    { code: '1701', name: 'Fabricacion de pasta de madera, papel y carton' },
    { code: '1702', name: 'Fabricacion de papel y carton ondulado y de envases de papel y carton' },
    { code: '1709', name: 'Fabricacion de otros articulos de papel y carton' },
  ],

  // Division 18: Impresion y reproduccion de grabaciones
  '181': [
    { code: '1811', name: 'Impresion' },
    { code: '1812', name: 'Actividades de servicios relacionadas con la impresion' },
  ],
  '182': [
    { code: '1820', name: 'Reproduccion de grabaciones' },
  ],

  // Division 19: Fabricacion de coque y refinacion del petroleo
  '191': [
    { code: '1910', name: 'Fabricacion de productos de hornos de coque' },
  ],
  '192': [
    { code: '1920', name: 'Fabricacion de productos de la refinacion del petroleo' },
  ],

  // Division 20: Fabricacion de sustancias y productos quimicos
  '201': [
    { code: '2011', name: 'Fabricacion de sustancias quimicas basicas' },
    { code: '2012', name: 'Fabricacion de abonos y compuestos de nitrogeno' },
    { code: '2013', name: 'Fabricacion de plasticos y de caucho sintetico en formas primarias' },
  ],
  '202': [
    { code: '2021', name: 'Fabricacion de plaguicidas y otros productos quimicos de uso agropecuario' },
    { code: '2022', name: 'Fabricacion de pinturas, barnices y productos de revestimiento similares, tintas de imprenta y masillas' },
    { code: '2023', name: 'Fabricacion de jabones y detergentes, preparados para limpiar y pulir, perfumes y preparados de tocador' },
    { code: '2029', name: 'Fabricacion de otros productos quimicos n.c.p.' },
  ],
  '203': [
    { code: '2030', name: 'Fabricacion de fibras artificiales' },
  ],

  // Division 21: Fabricacion de productos farmaceuticos
  '210': [
    { code: '2100', name: 'Fabricacion de productos farmaceuticos, sustancias quimicas medicinales y productos botanicos de uso farmaceutico' },
  ],

  // Division 22: Fabricacion de caucho y plastico
  '221': [
    { code: '2211', name: 'Fabricacion de cubiertas y camaras de caucho; recauchutado y renovacion de cubiertas de caucho' },
    { code: '2219', name: 'Fabricacion de otros productos de caucho' },
  ],
  '222': [
    { code: '2220', name: 'Fabricacion de productos de plastico' },
  ],

  // Division 23: Fabricacion de otros productos minerales no metalicos
  '231': [
    { code: '2310', name: 'Fabricacion de vidrio y productos de vidrio' },
  ],
  '239': [
    { code: '2391', name: 'Fabricacion de productos refractarios' },
    { code: '2392', name: 'Fabricacion de materiales de construccion de arcilla' },
    { code: '2393', name: 'Fabricacion de otros productos de porcelana y de ceramica' },
    { code: '2394', name: 'Fabricacion de cemento, cal y yeso' },
    { code: '2395', name: 'Fabricacion de articulos de hormigon, de cemento y de yeso' },
    { code: '2396', name: 'Corte, talla y acabado de la piedra' },
    { code: '2399', name: 'Fabricacion de otros productos minerales no metalicos n.c.p.' },
  ],

  // Division 24: Fabricacion de metales comunes
  '241': [
    { code: '2410', name: 'Industrias basicas de hierro y acero' },
  ],
  '242': [
    { code: '2420', name: 'Fabricacion de productos primarios de metales preciosos y otros metales no ferrosos' },
  ],
  '243': [
    { code: '2431', name: 'Fundicion de hierro y acero' },
    { code: '2432', name: 'Fundicion de metales no ferrosos' },
  ],

  // Division 25: Fabricacion de productos elaborados de metal
  '251': [
    { code: '2511', name: 'Fabricacion de productos metalicos para uso estructural' },
    { code: '2512', name: 'Fabricacion de tanques, depositos y recipientes de metal' },
    { code: '2513', name: 'Fabricacion de generadores de vapor, excepto calderas de agua caliente para calefaccion central' },
  ],
  '252': [
    { code: '2520', name: 'Fabricacion de armas y municiones' },
  ],
  '259': [
    { code: '2591', name: 'Forja, prensado, estampado y laminado de metales; pulvimetalurgia' },
    { code: '2592', name: 'Tratamiento y revestimiento de metales; maquinado' },
    { code: '2593', name: 'Fabricacion de articulos de cuchilleria, herramientas de mano y articulos de ferreteria' },
    { code: '2599', name: 'Fabricacion de otros productos elaborados de metal n.c.p.' },
  ],

  // Division 26: Fabricacion de productos de informatica, electronica y optica
  '261': [
    { code: '2610', name: 'Fabricacion de componentes y tableros electronicos' },
  ],
  '262': [
    { code: '2620', name: 'Fabricacion de ordenadores y equipo periferico' },
  ],
  '263': [
    { code: '2630', name: 'Fabricacion de equipo de comunicaciones' },
  ],
  '264': [
    { code: '2640', name: 'Fabricacion de aparatos electronicos de consumo' },
  ],
  '265': [
    { code: '2651', name: 'Fabricacion de equipo de medicion, prueba, navegacion y control' },
    { code: '2652', name: 'Fabricacion de relojes' },
  ],
  '266': [
    { code: '2660', name: 'Fabricacion de equipo de irradiacion y equipo electronico de uso medico y terapeutico' },
  ],
  '267': [
    { code: '2670', name: 'Fabricacion de instrumentos opticos y equipo fotografico' },
  ],
  '268': [
    { code: '2680', name: 'Fabricacion de soportes magneticos y opticos' },
  ],

  // Division 27: Fabricacion de equipo electrico
  '271': [
    { code: '2710', name: 'Fabricacion de motores, generadores, transformadores electricos y aparatos de distribucion y control de la energia electrica' },
  ],
  '272': [
    { code: '2720', name: 'Fabricacion de pilas, baterias y acumuladores' },
  ],
  '273': [
    { code: '2731', name: 'Fabricacion de cables de fibra optica' },
    { code: '2732', name: 'Fabricacion de otros hilos y cables electricos' },
    { code: '2733', name: 'Fabricacion de dispositivos de cableado' },
  ],
  '274': [
    { code: '2740', name: 'Fabricacion de equipo electrico de iluminacion' },
  ],
  '275': [
    { code: '2750', name: 'Fabricacion de aparatos de uso domestico' },
  ],
  '279': [
    { code: '2790', name: 'Fabricacion de otros tipos de equipo electrico' },
  ],

  // Division 28: Fabricacion de maquinaria y equipo n.c.p.
  '281': [
    { code: '2811', name: 'Fabricacion de motores y turbinas, excepto motores para aeronaves, vehiculos automotores y motocicletas' },
    { code: '2812', name: 'Fabricacion de equipo de potencia hidraulica y neumatica' },
    { code: '2813', name: 'Fabricacion de otras bombas, compresores, grifos y valvulas' },
    { code: '2814', name: 'Fabricacion de cojinetes, engranajes, trenes de engranajes y piezas de transmision' },
    { code: '2815', name: 'Fabricacion de hornos, hogares y quemadores' },
    { code: '2816', name: 'Fabricacion de equipo de elevacion y manipulacion' },
    { code: '2817', name: 'Fabricacion de maquinaria y equipo de oficina (excepto ordenadores y equipo periferico)' },
    { code: '2818', name: 'Fabricacion de herramientas de mano motorizadas' },
    { code: '2819', name: 'Fabricacion de otros tipos de maquinaria de uso general' },
  ],
  '282': [
    { code: '2821', name: 'Fabricacion de maquinaria agropecuaria y forestal' },
    { code: '2822', name: 'Fabricacion de maquinaria para la conformacion de metales y de maquinas herramienta' },
    { code: '2823', name: 'Fabricacion de maquinaria metalurgica' },
    { code: '2824', name: 'Fabricacion de maquinaria para la explotacion de minas y canteras y para obras de construccion' },
    { code: '2825', name: 'Fabricacion de maquinaria para la elaboracion de alimentos, bebidas y tabaco' },
    { code: '2826', name: 'Fabricacion de maquinaria para la elaboracion de productos textiles, prendas de vestir y cueros' },
    { code: '2829', name: 'Fabricacion de otros tipos de maquinaria de uso especial' },
  ],

  // Division 29: Fabricacion de vehiculos automotores
  '291': [
    { code: '2910', name: 'Fabricacion de vehiculos automotores' },
  ],
  '292': [
    { code: '2920', name: 'Fabricacion de carrocerias para vehiculos automotores; fabricacion de remolques y semirremolques' },
  ],
  '293': [
    { code: '2930', name: 'Fabricacion de partes, piezas y accesorios para vehiculos automotores' },
  ],

  // Division 30: Fabricacion de otro equipo de transporte
  '301': [
    { code: '3011', name: 'Construccion de buques y estructuras flotantes' },
    { code: '3012', name: 'Construccion de embarcaciones de recreo y de deporte' },
  ],
  '302': [
    { code: '3020', name: 'Fabricacion de locomotoras y material rodante' },
  ],
  '303': [
    { code: '3030', name: 'Fabricacion de aeronaves y naves espaciales y maquinaria conexa' },
  ],
  '304': [
    { code: '3040', name: 'Fabricacion de vehiculos militares de combate' },
  ],
  '309': [
    { code: '3091', name: 'Fabricacion de motocicletas' },
    { code: '3092', name: 'Fabricacion de bicicletas y de sillas de ruedas para invalidos' },
    { code: '3099', name: 'Fabricacion de otros tipos de equipo de transporte n.c.p.' },
  ],

  // Division 31: Fabricacion de muebles
  '310': [
    { code: '3100', name: 'Fabricacion de muebles' },
  ],

  // Division 32: Otras industrias manufactureras
  '321': [
    { code: '3211', name: 'Fabricacion de joyas y articulos conexos' },
    { code: '3212', name: 'Fabricacion de bisuteria y articulos conexos' },
  ],
  '322': [
    { code: '3220', name: 'Fabricacion de instrumentos de musica' },
  ],
  '323': [
    { code: '3230', name: 'Fabricacion de articulos de deporte' },
  ],
  '324': [
    { code: '3240', name: 'Fabricacion de juegos y juguetes' },
  ],
  '325': [
    { code: '3250', name: 'Fabricacion de instrumentos y materiales medicos y odontologicos' },
  ],
  '329': [
    { code: '3290', name: 'Otras industrias manufactureras n.c.p.' },
  ],

  // Division 33: Reparacion e instalacion de maquinaria y equipo
  '331': [
    { code: '3311', name: 'Reparacion de productos elaborados de metal' },
    { code: '3312', name: 'Reparacion de maquinaria' },
    { code: '3313', name: 'Reparacion de equipo electronico y optico' },
    { code: '3314', name: 'Reparacion de equipo electrico' },
    { code: '3315', name: 'Reparacion de equipo de transporte, excepto vehiculos automotores' },
    { code: '3319', name: 'Reparacion de otros tipos de equipo' },
  ],
  '332': [
    { code: '3320', name: 'Instalacion de maquinaria y equipo industriales' },
  ],

  // === SECCION D: Suministro de electricidad, gas, vapor y aire acondicionado ===

  // Division 35: Suministro de electricidad, gas, vapor y aire acondicionado
  '351': [
    { code: '3510', name: 'Generacion, transmision y distribucion de energia electrica' },
  ],
  '352': [
    { code: '3520', name: 'Fabricacion de gas; distribucion de combustibles gaseosos por tuberias' },
  ],
  '353': [
    { code: '3530', name: 'Suministro de vapor y de aire acondicionado' },
  ],

  // === SECCION E: Suministro de agua; evacuacion de aguas residuales ===

  // Division 36: Captacion, tratamiento y distribucion de agua
  '360': [
    { code: '3600', name: 'Captacion, tratamiento y distribucion de agua' },
  ],

  // Division 37: Evacuacion de aguas residuales
  '370': [
    { code: '3700', name: 'Evacuacion de aguas residuales' },
  ],

  // Division 38: Recogida, tratamiento y eliminacion de desechos
  '381': [
    { code: '3811', name: 'Recogida de desechos no peligrosos' },
    { code: '3812', name: 'Recogida de desechos peligrosos' },
  ],
  '382': [
    { code: '3821', name: 'Tratamiento y eliminacion de desechos no peligrosos' },
    { code: '3822', name: 'Tratamiento y eliminacion de desechos peligrosos' },
  ],
  '383': [
    { code: '3830', name: 'Recuperacion de materiales' },
  ],

  // Division 39: Actividades de descontaminacion
  '390': [
    { code: '3900', name: 'Actividades de descontaminacion y otros servicios de gestion de desechos' },
  ],

  // === SECCION F: Construccion ===

  // Division 41: Construccion de edificios
  '410': [
    { code: '4100', name: 'Construccion de edificios' },
  ],

  // Division 42: Obras de ingenieria civil
  '421': [
    { code: '4210', name: 'Construccion de carreteras y lineas de ferrocarril' },
  ],
  '422': [
    { code: '4220', name: 'Construccion de proyectos de servicio publico' },
  ],
  '429': [
    { code: '4290', name: 'Construccion de otras obras de ingenieria civil' },
  ],

  // Division 43: Actividades especializadas de construccion
  '431': [
    { code: '4311', name: 'Demolicion' },
    { code: '4312', name: 'Preparacion del terreno' },
  ],
  '432': [
    { code: '4321', name: 'Instalaciones electricas' },
    { code: '4322', name: 'Instalaciones de fontaneria, calefaccion y aire acondicionado' },
    { code: '4329', name: 'Otras instalaciones para obras de construccion' },
  ],
  '433': [
    { code: '4330', name: 'Terminacion y acabado de edificios' },
  ],
  '439': [
    { code: '4390', name: 'Otras actividades especializadas de construccion' },
  ],

  // === SECCION G: Comercio al por mayor y al por menor ===

  // Division 45: Comercio y reparacion de vehiculos automotores y motocicletas
  '451': [
    { code: '4510', name: 'Venta de vehiculos automotores' },
  ],
  '452': [
    { code: '4520', name: 'Mantenimiento y reparacion de vehiculos automotores' },
  ],
  '453': [
    { code: '4530', name: 'Venta de partes, piezas y accesorios para vehiculos automotores' },
  ],
  '454': [
    { code: '4540', name: 'Venta, mantenimiento y reparacion de motocicletas y de sus partes, piezas y accesorios' },
  ],

  // Division 46: Comercio al por mayor
  '461': [
    { code: '4610', name: 'Venta al por mayor a cambio de una retribucion o por contrata' },
  ],
  '462': [
    { code: '4620', name: 'Venta al por mayor de materias primas agropecuarias y animales vivos' },
  ],
  '463': [
    { code: '4630', name: 'Venta al por mayor de alimentos, bebidas y tabaco' },
  ],
  '464': [
    { code: '4641', name: 'Venta al por mayor de productos textiles, prendas de vestir y calzado' },
    { code: '4649', name: 'Venta al por mayor de otros enseres domesticos' },
  ],
  '465': [
    { code: '4651', name: 'Venta al por mayor de ordenadores, equipo periferico y programas de informatica' },
    { code: '4652', name: 'Venta al por mayor de equipo, partes y piezas electronicos y de telecomunicaciones' },
    { code: '4653', name: 'Venta al por mayor de maquinaria, equipo y materiales agropecuarios' },
    { code: '4659', name: 'Venta al por mayor de otros tipos de maquinaria y equipo' },
  ],
  '466': [
    { code: '4661', name: 'Venta al por mayor de combustibles solidos, liquidos y gaseosos y productos conexos' },
    { code: '4662', name: 'Venta al por mayor de metales y minerales metaliferos' },
    { code: '4663', name: 'Venta al por mayor de materiales de construccion, articulos de ferreteria y equipo y materiales de fontaneria y calefaccion' },
    { code: '4669', name: 'Venta al por mayor de desperdicios, desechos, chatarra y otros productos n.c.p.' },
  ],
  '469': [
    { code: '4690', name: 'Venta al por mayor no especializada' },
  ],

  // Division 47: Comercio al por menor
  '471': [
    { code: '4711', name: 'Venta al por menor en comercios no especializados con predominio de la venta de alimentos, bebidas o tabaco' },
    { code: '4719', name: 'Otras actividades de venta al por menor en comercios no especializados' },
  ],
  '472': [
    { code: '4721', name: 'Venta al por menor de alimentos en comercios especializados' },
    { code: '4722', name: 'Venta al por menor de bebidas en comercios especializados' },
    { code: '4723', name: 'Venta al por menor de tabaco en comercios especializados' },
  ],
  '473': [
    { code: '4730', name: 'Venta al por menor de combustibles para vehiculos automotores en comercios especializados' },
  ],
  '474': [
    { code: '4741', name: 'Venta al por menor de ordenadores, equipo periferico, programas de informatica y equipo de telecomunicaciones en comercios especializados' },
    { code: '4742', name: 'Venta al por menor de equipo de sonido y de video en comercios especializados' },
  ],
  '475': [
    { code: '4751', name: 'Venta al por menor de productos textiles en comercios especializados' },
    { code: '4752', name: 'Venta al por menor de articulos de ferreteria, pinturas y productos de vidrio en comercios especializados' },
    { code: '4753', name: 'Venta al por menor de tapices, alfombras y cubrimientos para paredes y pisos en comercios especializados' },
    { code: '4759', name: 'Venta al por menor de aparatos electricos de uso domestico, muebles, equipo de iluminacion y otros enseres domesticos en comercios especializados' },
  ],
  '476': [
    { code: '4761', name: 'Venta al por menor de libros, periodicos y articulos de papeleria en comercios especializados' },
    { code: '4762', name: 'Venta al por menor de grabaciones de musica y de video en comercios especializados' },
    { code: '4763', name: 'Venta al por menor de equipo de deporte en comercios especializados' },
    { code: '4764', name: 'Venta al por menor de juegos y juguetes en comercios especializados' },
  ],
  '477': [
    { code: '4771', name: 'Venta al por menor de prendas de vestir, calzado y articulos de cuero en comercios especializados' },
    { code: '4772', name: 'Venta al por menor de productos farmaceuticos y medicinales, cosmeticos y articulos de tocador en comercios especializados' },
    { code: '4773', name: 'Venta al por menor de otros productos nuevos en comercios especializados' },
    { code: '4774', name: 'Venta al por menor de articulos de segunda mano' },
  ],
  '478': [
    { code: '4781', name: 'Venta al por menor de alimentos, bebidas y tabaco en puestos de venta y mercados' },
    { code: '4782', name: 'Venta al por menor de productos textiles, prendas de vestir y calzado en puestos de venta y mercados' },
    { code: '4789', name: 'Venta al por menor de otros productos en puestos de venta y mercados' },
  ],
  '479': [
    { code: '4791', name: 'Venta al por menor por correspondencia y por Internet' },
    { code: '4799', name: 'Otras actividades de venta al por menor no realizadas en comercios, puestos de venta ni mercados' },
  ],

  // === SECCION H: Transporte y almacenamiento ===

  // Division 49: Transporte por via terrestre y por tuberias
  '491': [
    { code: '4911', name: 'Transporte interurbano de pasajeros por ferrocarril' },
    { code: '4912', name: 'Transporte de carga por ferrocarril' },
  ],
  '492': [
    { code: '4921', name: 'Transporte urbano y suburbano de pasajeros por via terrestre' },
    { code: '4922', name: 'Otras actividades de transporte de pasajeros por via terrestre' },
    { code: '4923', name: 'Transporte de carga por via terrestre' },
  ],
  '493': [
    { code: '4930', name: 'Transporte por tuberias' },
  ],

  // Division 50: Transporte por via acuatica
  '501': [
    { code: '5011', name: 'Transporte de pasajeros maritimo y de cabotaje' },
    { code: '5012', name: 'Transporte de carga maritimo y de cabotaje' },
  ],
  '502': [
    { code: '5021', name: 'Transporte de pasajeros por vias de navegacion interiores' },
    { code: '5022', name: 'Transporte de carga por vias de navegacion interiores' },
  ],

  // Division 51: Transporte por via aerea
  '511': [
    { code: '5110', name: 'Transporte de pasajeros por via aerea' },
  ],
  '512': [
    { code: '5120', name: 'Transporte de carga por via aerea' },
  ],

  // Division 52: Almacenamiento y actividades de apoyo al transporte
  '521': [
    { code: '5210', name: 'Almacenamiento y deposito' },
  ],
  '522': [
    { code: '5221', name: 'Actividades de servicios vinculadas al transporte terrestre' },
    { code: '5222', name: 'Actividades de servicios vinculadas al transporte acuatico' },
    { code: '5223', name: 'Actividades de servicios vinculadas al transporte aereo' },
    { code: '5224', name: 'Manipulacion de la carga' },
    { code: '5229', name: 'Otras actividades de apoyo al transporte' },
  ],

  // Division 53: Actividades postales y de mensajeria
  '531': [
    { code: '5310', name: 'Actividades postales' },
  ],
  '532': [
    { code: '5320', name: 'Actividades de mensajeria' },
  ],

  // === SECCION I: Alojamiento y servicios de comida ===

  // Division 55: Alojamiento
  '551': [
    { code: '5510', name: 'Actividades de alojamiento para estancias cortas' },
  ],
  '552': [
    { code: '5520', name: 'Actividades de campamentos, parques de vehiculos recreativos y parques de caravanas' },
  ],
  '559': [
    { code: '5590', name: 'Otras actividades de alojamiento' },
  ],

  // Division 56: Actividades de servicio de comidas y bebidas
  '561': [
    { code: '5610', name: 'Actividades de restaurantes y de servicio movil de comidas' },
  ],
  '562': [
    { code: '5621', name: 'Suministro de comidas por encargo' },
    { code: '5629', name: 'Otras actividades de servicio de comidas' },
  ],
  '563': [
    { code: '5630', name: 'Actividades de servicio de bebidas' },
  ],

  // === SECCION J: Informacion y comunicaciones ===

  // Division 58: Actividades de edicion
  '581': [
    { code: '5811', name: 'Edicion de libros' },
    { code: '5812', name: 'Edicion de directorios y listas de correo' },
    { code: '5813', name: 'Edicion de periodicos, diarios y revistas' },
    { code: '5819', name: 'Otras actividades de edicion' },
  ],
  '582': [
    { code: '5820', name: 'Edicion de programas de informatica' },
  ],

  // Division 59: Produccion de peliculas, grabacion de sonido y edicion de musica
  '591': [
    { code: '5911', name: 'Actividades de produccion de peliculas cinematograficas, videos y programas de television' },
    { code: '5912', name: 'Actividades de postproduccion de peliculas cinematograficas, videos y programas de television' },
    { code: '5913', name: 'Actividades de distribucion de peliculas cinematograficas, videos y programas de television' },
    { code: '5914', name: 'Actividades de exhibicion de peliculas cinematograficas' },
  ],
  '592': [
    { code: '5920', name: 'Actividades de grabacion de sonido y edicion de musica' },
  ],

  // Division 60: Actividades de programacion y transmision
  '601': [
    { code: '6010', name: 'Transmisiones de radio' },
  ],
  '602': [
    { code: '6020', name: 'Programacion y transmisiones de television' },
  ],

  // Division 61: Telecomunicaciones
  '611': [
    { code: '6110', name: 'Actividades de telecomunicaciones alambricas' },
  ],
  '612': [
    { code: '6120', name: 'Actividades de telecomunicaciones inalambricas' },
  ],
  '613': [
    { code: '6130', name: 'Actividades de telecomunicaciones por satelite' },
  ],
  '619': [
    { code: '6190', name: 'Otras actividades de telecomunicaciones' },
  ],

  // Division 62: Programacion informatica, consultoria de informatica
  '620': [
    { code: '6201', name: 'Actividades de programacion informatica' },
    { code: '6202', name: 'Actividades de consultoria de informatica y de gestion de instalaciones informaticas' },
    { code: '6209', name: 'Otras actividades de tecnologia de la informacion y de servicios informaticos' },
  ],

  // Division 63: Actividades de servicios de informacion
  '631': [
    { code: '6311', name: 'Procesamiento de datos, hospedaje y actividades conexas' },
    { code: '6312', name: 'Portales web' },
  ],
  '639': [
    { code: '6391', name: 'Actividades de agencias de noticias' },
    { code: '6399', name: 'Otras actividades de servicios de informacion n.c.p.' },
  ],

  // === SECCION K: Actividades financieras y de seguros ===

  // Division 64: Actividades de servicios financieros
  '641': [
    { code: '6411', name: 'Banca central' },
    { code: '6419', name: 'Otros tipos de intermediacion monetaria' },
  ],
  '642': [
    { code: '6420', name: 'Actividades de sociedades de cartera' },
  ],
  '643': [
    { code: '6430', name: 'Fondos y sociedades de inversion y entidades financieras similares' },
  ],
  '649': [
    { code: '6491', name: 'Arrendamiento financiero' },
    { code: '6492', name: 'Otras actividades crediticias' },
    { code: '6499', name: 'Otras actividades de servicios financieros, excepto las de seguros y fondos de pensiones, n.c.p.' },
  ],

  // Division 65: Seguros, reaseguros y fondos de pensiones
  '651': [
    { code: '6511', name: 'Seguros de vida' },
    { code: '6512', name: 'Seguros generales' },
  ],
  '652': [
    { code: '6520', name: 'Reaseguros' },
  ],
  '653': [
    { code: '6530', name: 'Fondos de pensiones' },
  ],

  // Division 66: Actividades auxiliares de las actividades de servicios financieros
  '661': [
    { code: '6611', name: 'Administracion de mercados financieros' },
    { code: '6612', name: 'Corretaje de valores y de contratos de productos basicos' },
    { code: '6619', name: 'Otras actividades auxiliares de las actividades de servicios financieros' },
  ],
  '662': [
    { code: '6621', name: 'Evaluacion de riesgos y danos' },
    { code: '6622', name: 'Actividades de agentes y corredores de seguros' },
    { code: '6629', name: 'Otras actividades auxiliares de las actividades de seguros y fondos de pensiones' },
  ],
  '663': [
    { code: '6630', name: 'Actividades de gestion de fondos' },
  ],

  // === SECCION L: Actividades inmobiliarias ===

  // Division 68: Actividades inmobiliarias
  '681': [
    { code: '6810', name: 'Actividades inmobiliarias realizadas con bienes propios o arrendados' },
  ],
  '682': [
    { code: '6820', name: 'Actividades inmobiliarias realizadas a cambio de una retribucion o por contrata' },
  ],

  // === SECCION M: Actividades profesionales, cientificas y tecnicas ===

  // Division 69: Actividades juridicas y de contabilidad
  '691': [
    { code: '6910', name: 'Actividades juridicas' },
  ],
  '692': [
    { code: '6920', name: 'Actividades de contabilidad, teneduria de libros y auditoria; consultoria fiscal' },
  ],

  // Division 70: Actividades de oficinas principales; consultoria de gestion
  '701': [
    { code: '7010', name: 'Actividades de oficinas principales' },
  ],
  '702': [
    { code: '7020', name: 'Actividades de consultoria de gestion' },
  ],

  // Division 71: Actividades de arquitectura e ingenieria
  '711': [
    { code: '7110', name: 'Actividades de arquitectura e ingenieria y actividades conexas de consultoria tecnica' },
  ],
  '712': [
    { code: '7120', name: 'Ensayos y analisis tecnicos' },
  ],

  // Division 72: Investigacion cientifica y desarrollo
  '721': [
    { code: '7210', name: 'Investigaciones y desarrollo experimental en el campo de las ciencias naturales y la ingenieria' },
  ],
  '722': [
    { code: '7220', name: 'Investigaciones y desarrollo experimental en el campo de las ciencias sociales y las humanidades' },
  ],

  // Division 73: Publicidad e investigacion de mercados
  '731': [
    { code: '7310', name: 'Publicidad' },
  ],
  '732': [
    { code: '7320', name: 'Estudios de mercado y encuestas de opinion publica' },
  ],

  // Division 74: Otras actividades profesionales, cientificas y tecnicas
  '741': [
    { code: '7410', name: 'Actividades de diseno especializado' },
  ],
  '742': [
    { code: '7420', name: 'Actividades de fotografia' },
  ],
  '749': [
    { code: '7490', name: 'Otras actividades profesionales, cientificas y tecnicas n.c.p.' },
  ],

  // Division 75: Actividades veterinarias
  '750': [
    { code: '7500', name: 'Actividades veterinarias' },
  ],

  // === SECCION N: Actividades de servicios administrativos y de apoyo ===

  // Division 77: Actividades de alquiler y arrendamiento
  '771': [
    { code: '7710', name: 'Alquiler y arrendamiento de vehiculos automotores' },
  ],
  '772': [
    { code: '7721', name: 'Alquiler y arrendamiento de equipo recreativo y deportivo' },
    { code: '7722', name: 'Alquiler de cintas de video y discos' },
    { code: '7729', name: 'Alquiler y arrendamiento de otros efectos personales y enseres domesticos' },
  ],
  '773': [
    { code: '7730', name: 'Alquiler y arrendamiento de otros tipos de maquinaria, equipo y bienes tangibles' },
  ],
  '774': [
    { code: '7740', name: 'Arrendamiento de propiedad intelectual y productos similares, excepto obras protegidas por derechos de autor' },
  ],

  // Division 78: Actividades de empleo
  '781': [
    { code: '7810', name: 'Actividades de agencias de empleo' },
  ],
  '782': [
    { code: '7820', name: 'Actividades de agencias de empleo temporal' },
  ],
  '783': [
    { code: '7830', name: 'Otras actividades de dotacion de recursos humanos' },
  ],

  // Division 79: Actividades de agencias de viajes y operadores turisticos
  '791': [
    { code: '7911', name: 'Actividades de agencias de viajes' },
    { code: '7912', name: 'Actividades de operadores turisticos' },
  ],
  '799': [
    { code: '7990', name: 'Otros servicios de reservas y actividades conexas' },
  ],

  // Division 80: Actividades de seguridad e investigacion
  '801': [
    { code: '8010', name: 'Actividades de seguridad privada' },
  ],
  '802': [
    { code: '8020', name: 'Actividades de servicios de sistemas de seguridad' },
  ],
  '803': [
    { code: '8030', name: 'Actividades de investigacion' },
  ],

  // Division 81: Actividades de servicios a edificios y de paisajismo
  '811': [
    { code: '8110', name: 'Actividades combinadas de apoyo a instalaciones' },
  ],
  '812': [
    { code: '8121', name: 'Limpieza general de edificios' },
    { code: '8129', name: 'Otras actividades de limpieza' },
  ],
  '813': [
    { code: '8130', name: 'Actividades de paisajismo y servicios de mantenimiento conexos' },
  ],

  // Division 82: Actividades administrativas y de apoyo de oficina
  '821': [
    { code: '8211', name: 'Actividades combinadas de servicios administrativos de oficina' },
    { code: '8219', name: 'Fotocopiado, preparacion de documentos y otras actividades especializadas de apoyo de oficina' },
  ],
  '822': [
    { code: '8220', name: 'Actividades de centros de llamadas' },
  ],
  '823': [
    { code: '8230', name: 'Organizacion de convenciones y exposiciones comerciales' },
  ],
  '829': [
    { code: '8291', name: 'Actividades de agencias de cobro y agencias de calificacion crediticia' },
    { code: '8292', name: 'Actividades de envasado y empaquetado' },
    { code: '8299', name: 'Otras actividades de servicios de apoyo a las empresas n.c.p.' },
  ],

  // === SECCION O: Administracion publica y defensa ===

  // Division 84: Administracion publica y defensa
  '841': [
    { code: '8411', name: 'Actividades de la administracion publica en general' },
    { code: '8412', name: 'Regulacion de las actividades de organismos que prestan servicios sanitarios, educativos, culturales y otros servicios sociales, excepto servicios de seguridad social' },
    { code: '8413', name: 'Regulacion y facilitacion de la actividad economica' },
  ],
  '842': [
    { code: '8421', name: 'Relaciones exteriores' },
    { code: '8422', name: 'Actividades de defensa' },
    { code: '8423', name: 'Actividades de mantenimiento del orden publico y de seguridad' },
  ],
  '843': [
    { code: '8430', name: 'Actividades de planes de seguridad social de afiliacion obligatoria' },
  ],

  // === SECCION P: Ensenanza ===

  // Division 85: Ensenanza
  '851': [
    { code: '8510', name: 'Ensenanza preescolar y primaria' },
  ],
  '852': [
    { code: '8521', name: 'Ensenanza secundaria de formacion general' },
    { code: '8522', name: 'Ensenanza secundaria de formacion tecnica y profesional' },
  ],
  '853': [
    { code: '8530', name: 'Ensenanza superior' },
  ],
  '854': [
    { code: '8541', name: 'Ensenanza deportiva y recreativa' },
    { code: '8542', name: 'Ensenanza cultural' },
    { code: '8549', name: 'Otros tipos de ensenanza n.c.p.' },
  ],
  '855': [
    { code: '8550', name: 'Actividades de apoyo a la ensenanza' },
  ],

  // === SECCION Q: Actividades de atencion de la salud humana ===

  // Division 86: Actividades de atencion de la salud humana
  '861': [
    { code: '8610', name: 'Actividades de hospitales' },
  ],
  '862': [
    { code: '8620', name: 'Actividades de medicos y odontologos' },
  ],
  '869': [
    { code: '8690', name: 'Otras actividades de atencion de la salud humana' },
  ],

  // Division 87: Actividades de atencion en instituciones
  '871': [
    { code: '8710', name: 'Actividades de atencion de enfermeria en instituciones' },
  ],
  '872': [
    { code: '8720', name: 'Actividades de atencion en instituciones para personas con retraso mental, enfermos mentales y toxicomanos' },
  ],
  '873': [
    { code: '8730', name: 'Actividades de atencion en instituciones para personas de edad y personas con discapacidad' },
  ],
  '879': [
    { code: '8790', name: 'Otras actividades de atencion en instituciones' },
  ],

  // Division 88: Actividades de asistencia social sin alojamiento
  '881': [
    { code: '8810', name: 'Actividades de asistencia social sin alojamiento para personas de edad y personas con discapacidad' },
  ],
  '889': [
    { code: '8890', name: 'Otras actividades de asistencia social sin alojamiento' },
  ],

  // === SECCION R: Actividades artisticas, de entretenimiento y recreativas ===

  // Division 90: Actividades creativas, artisticas y de entretenimiento
  '900': [
    { code: '9000', name: 'Actividades creativas, artisticas y de entretenimiento' },
  ],

  // Division 91: Actividades de bibliotecas, archivos, museos
  '910': [
    { code: '9101', name: 'Actividades de bibliotecas y archivos' },
    { code: '9102', name: 'Actividades de museos y gestion de lugares y edificios historicos' },
    { code: '9103', name: 'Actividades de jardines botanicos, zoologicos y reservas naturales' },
  ],

  // Division 92: Actividades de juegos de azar y apuestas
  '920': [
    { code: '9200', name: 'Actividades de juegos de azar y apuestas' },
  ],

  // Division 93: Actividades deportivas, de esparcimiento y recreativas
  '931': [
    { code: '9311', name: 'Gestion de instalaciones deportivas' },
    { code: '9312', name: 'Actividades de clubes deportivos' },
    { code: '9319', name: 'Otras actividades deportivas' },
  ],
  '932': [
    { code: '9321', name: 'Actividades de parques de atracciones y parques tematicos' },
    { code: '9329', name: 'Otras actividades de esparcimiento y recreativas n.c.p.' },
  ],

  // === SECCION S: Otras actividades de servicios ===

  // Division 94: Actividades de asociaciones
  '941': [
    { code: '9411', name: 'Actividades de asociaciones empresariales y de empleadores' },
    { code: '9412', name: 'Actividades de asociaciones profesionales' },
  ],
  '942': [
    { code: '9420', name: 'Actividades de sindicatos' },
  ],
  '949': [
    { code: '9491', name: 'Actividades de organizaciones religiosas' },
    { code: '9492', name: 'Actividades de organizaciones politicas' },
    { code: '9499', name: 'Actividades de otras asociaciones n.c.p.' },
  ],

  // Division 95: Reparacion de computadores y de efectos personales y enseres domesticos
  '951': [
    { code: '9511', name: 'Reparacion de ordenadores y equipo periferico' },
    { code: '9512', name: 'Reparacion de equipo de comunicaciones' },
  ],
  '952': [
    { code: '9521', name: 'Reparacion de aparatos electronicos de consumo' },
    { code: '9522', name: 'Reparacion de aparatos de uso domestico y de equipo para el hogar y el jardin' },
    { code: '9523', name: 'Reparacion de calzado y articulos de cuero' },
    { code: '9524', name: 'Reparacion de muebles y accesorios para el hogar' },
    { code: '9529', name: 'Reparacion de otros efectos personales y enseres domesticos' },
  ],

  // Division 96: Otras actividades de servicios personales
  '960': [
    { code: '9601', name: 'Lavado y limpieza, incluida la limpieza en seco, de productos textiles y de piel' },
    { code: '9602', name: 'Peluqueria y otros tratamientos de belleza' },
    { code: '9603', name: 'Pompas funebres y actividades conexas' },
    { code: '9609', name: 'Otras actividades de servicios personales n.c.p.' },
  ],

  // === SECCION T: Actividades de los hogares como empleadores ===

  // Division 97: Actividades de los hogares como empleadores de personal domestico
  '970': [
    { code: '9700', name: 'Actividades de los hogares como empleadores de personal domestico' },
  ],

  // Division 98: Actividades no diferenciadas de los hogares como productores
  '981': [
    { code: '9810', name: 'Actividades no diferenciadas de los hogares como productores de bienes para uso propio' },
  ],
  '982': [
    { code: '9820', name: 'Actividades no diferenciadas de los hogares como productores de servicios para uso propio' },
  ],

  // === SECCION U: Actividades de organizaciones y organos extraterritoriales ===

  // Division 99: Actividades de organizaciones y organos extraterritoriales
  '990': [
    { code: '9900', name: 'Actividades de organizaciones y organos extraterritoriales' },
  ],
};
