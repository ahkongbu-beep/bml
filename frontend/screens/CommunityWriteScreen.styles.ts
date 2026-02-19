import { StyleSheet } from 'react-native';
import { commonStyles, colors, shadows } from './common.styles';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343A40',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#868E96',
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#343A40',
    backgroundColor: '#F8F9FA',
  },
  textArea: {
    height: 200,
    paddingTop: 12,
  },
  charCount: {
    fontSize: 12,
    color: '#ADB5BD',
    textAlign: 'right',
    marginTop: 4,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#F8F9FA',
  },
  selectButtonText: {
    fontSize: 14,
    color: '#343A40',
  },
  placeholderText: {
    color: '#ADB5BD',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchLabelContainer: {
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#FF9AA2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    backgroundColor: '#DEE2E6',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#343A40',
  },
  modalContent: {
    padding: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  categoryItemText: {
    fontSize: 16,
    color: '#343A40',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageUploadButton: {
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 12,
    borderStyle: 'dashed',
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
  },
  imageUploadText: {
    fontSize: 12,
    color: '#868E96',
    marginTop: 4,
  },
  imageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  imageRemoveButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 2,
  },
});

export default styles;