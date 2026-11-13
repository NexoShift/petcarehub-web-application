/** Qué tipo de imagen se analiza. Cada tipo usa su propio modelo en Roboflow. */
export enum ImageType {
  /** Foto de piel o lesión externa: detección de objetos, con cajas. */
  Skin = 'SKIN',
  /** Radiografía: clasificación, sin cajas (panel de probabilidades). */
  Radiograph = 'RADIOGRAPH',
}
