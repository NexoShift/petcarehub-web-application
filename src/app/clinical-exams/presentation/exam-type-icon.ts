import { IconName } from '../../shared/presentation/components/icon/icon';
import { ExamType } from '../domain/enums/exam-type.enum';

/** Ícono (app-icon) de cada tipo de examen, para las tarjetas y listas. */
export const EXAM_TYPE_ICONS: Record<ExamType, IconName> = {
  [ExamType.Radiography]: 'xray',
  [ExamType.Ultrasound]: 'scan',
  [ExamType.Laboratory]: 'flask',
  [ExamType.Other]: 'microscope',
};
