import { useState } from "react";
import { ethers } from "ethers";
import { Row, Form, Button } from "react-bootstrap";
import { Buffer } from "buffer";
import { pinJSONToIPFS } from "./pinata.js";
//import img1 from "./subheader.jpg";

const Create = ({ marketplace, nft, auction }) => {
  const [image, setImage] = useState("");
  const [price, setPrice] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [buffer, setBuffer] = useState(null);
  const [waiting, setwaiting] = useState("");

  /*
  BLOB stands for a “Binary Large Object,” a data type that stores binary data. The File interface is based on Blob

  The purpose of the fileReader is to read data from Blob objects. It provides data with the usage of events because reading from disk might take long.
  readAsArrayBuffer(blob) – reading data in binary format ArrayBuffer.
  */

  const createNFT = async () => {
    if (!image || !price || !name || !description) return;
    try {
      // var f = new File([""], "filename.txt", {type: "text/plain",lastModified: '101010'})
      //console.log(f)
      //console.log(image)
      const sample = {};
      sample.name = image.name;
      const file = image.name;
      const reader = new window.FileReader(); //Interface FileReader trong Javascript được thiết kế để đọc các nguồn dữ liệu trên máy tính của người dùng.
      reader.readAsArrayBuffer(image);  // readAsArrayBuffer(blob) – reading data in binary format ArrayBuffer.

      reader.onloadend = () => {
        setBuffer({ buffer: Buffer(reader.result) });
        console.log("buffer", buffer);
      };

      if (buffer === null) {
        return;
      }
      setwaiting("Wait...");
      console.log(waiting)
      const metadata = {};
      metadata.name = name;
      metadata.image = buffer;
      metadata.description = description;

      const pinataResponse1 = await pinJSONToIPFS(metadata);

      if (!pinataResponse1.success) {
        setwaiting("Error try again");
        return {
          success: false,
          status: "Something went wrong while uploading your tokenURI.",
        };
      }
      const tokenURI = pinataResponse1.pinataUrl;
      console.log('token uri', tokenURI)
      
      mintThenList(tokenURI);
    } catch (error) {
      console.log("ipfs uri upload error: ", error);
    }
  };
  const mintThenList = async (result) => {
    const uri = result;
    console.log(uri);
   
    try {
      await(await nft.mint(uri)).wait()
    // get tokenId of new nft 
    const id = await nft.tokenCount()
    // approve marketplace to spend nft
    await(await nft.setApprovalForAll(marketplace.address, true)).wait()
    // add nft to marketplace
    const listingPrice = ethers.utils.parseEther(price.toString())
    await(await marketplace.makeItem(nft.address, id, listingPrice)).wait()

    console.log(marketplace.itemCount())
    
    setwaiting("");
    } catch (error) {
      console.log(error)
    }
  };
  return (
    <>
      <section
        className="jumbotron breadcumb no-bg"
        style={{
          //backgroundImage: `url(${img1})`,
          padding: "30px",
        }}
      >
        <div className="mainbreadcumb">
          <div className="container">
            <div className="row m-10-hor">
              <div className="col-12">
                <h1
                  className="text-center"
                  style={{ color: "white", fontSize: "50px" }}
                >
                  Create
                </h1>
                <p style={{ color: "white" }}>{waiting}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="container-fluid mt-5">
        <div className="row">
          <main
            role="main"
            className="col-lg-12 mx-auto"
            style={{
              maxWidth: "1000px",
            }}
          >
            <div className="content mx-auto">
              <Row className="g-4">
                {/* <Form.Control
                type="file"
                required
                name="file"
                onChange={(e) => setImage(e.target.value)}
                // onChange={uploadToIPFS}
              /> */}
                <input
                  type="file"
                  onChange={(e) => setImage(e.target.files[0])}
                  required
                />
                <Form.Control
                  onChange={(e) => setName(e.target.value)}
                  size="lg"
                  required
                  type="text"
                  placeholder="Name"
                />
                <Form.Control
                  onChange={(e) => setDescription(e.target.value)}
                  size="lg"
                  required
                  as="textarea"
                  placeholder="Description"
                />
                <Form.Control
                  onChange={(e) => setPrice(e.target.value)}
                  size="lg"
                  required
                  type="number"
                  placeholder="Price in ETH"
                />
                <div className="d-grid px-0">
                  <Button onClick={createNFT} variant="primary" size="lg">
                    Create & List NFT!
                  </Button>
                </div>
              </Row>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default Create;
