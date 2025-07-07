'use client';

import { Button } from '@/components/ui/button';
import useModal from '@/hooks/useModal';

/**
 * Props for the SpaceActionButton component
 */
type Props = {
  /** The text to display on the button */
  label: string;
  /** The name of the modal to open when button is clicked */
  modalName: string;
};

/**
 * A button component that opens a modal when clicked
 *
 * @param props - The component props
 * @param props.label - The text to display on the button
 * @param props.modalName - The name of the modal to open when button is clicked
 * @returns A button element that triggers modal opening
 */
const SpaceActionButton = ({ label, modalName }: Props) => {
  const { openModal } = useModal();

  return <Button onClick={() => openModal(modalName)}>{label}</Button>;
};

export default SpaceActionButton;
