import { useFormik } from 'formik';
import BaseDialog from '../common/BaseDialog';
import ReactSelect from '../common/ReactSelect';
import Input from '../common/form/Input';

interface Props {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}
const AddNewAddress = ({ open }: Props) => {
  const formik = useFormik({
    initialValues: {},
    onSubmit: () => {},
  });

  return (
    <BaseDialog
      title="افزودن آدرس جدید"
      isOpen={open}
      onClickFooter={() => {}}
      nameBtnFooter="بستن"
    >
      <div className="p-2">
        <form className="grid gap-x-6 gap-y-3 lg:grid-cols-2">
          <ReactSelect
            triggerClass="!h-[48px]"
            label="استان"
            formik={formik}
            name=""
            options={[]}
          />
          <ReactSelect label="شهرستان" formik={formik} name="" options={[]} />
          <Input
            className="lg:col-span-2"
            label="آدرس"
            // @ts-expect-error error
            formik={formik}
            name=""
            required
          />
          {/*@ts-expect-error error */}
          <Input className="col-span-2" label="کد پستی" formik={formik} name="" required />
        </form>
      </div>
    </BaseDialog>
  );
};

export default AddNewAddress;
