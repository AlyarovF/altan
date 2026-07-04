import { BadRequestException } from '@nestjs/common';
import { MediaService } from './media.service';

type AnyFn = jest.Mock;

interface MockPrisma {
  mediaAsset: { create: AnyFn };
}

function makeDeps(maxBytes = 5_242_880) {
  const prisma: MockPrisma = {
    mediaAsset: {
      create: jest.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) => ({
        id: 'asset-1',
        url: data.url,
        alt: (data.alt as string | null) ?? null,
        type: data.type,
        width: null,
        height: null,
        productId: null,
        createdAt: new Date('2026-06-20T00:00:00.000Z'),
      })),
    },
  };
  const audit = { log: jest.fn().mockResolvedValue(undefined) };
  const config = {
    get: jest.fn((k: string) => (k === 'MEDIA_DIR' ? '/tmp/altan-test-uploads' : maxBytes)),
  };
  const service = new MediaService(prisma as never, audit as never, config as never);
  return { service, prisma, audit };
}

function file(partial: Partial<Express.Multer.File>): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: 'x.png',
    encoding: '7bit',
    mimetype: 'image/png',
    size: 1024,
    buffer: Buffer.from('data'),
    stream: undefined as never,
    destination: '',
    filename: '',
    path: '',
    ...partial,
  };
}

describe('MediaService.upload', () => {
  it('rejects a missing file', async () => {
    const { service } = makeDeps();
    await expect(service.upload(undefined, 'actor-1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a non-image MIME type', async () => {
    const { service } = makeDeps();
    await expect(
      service.upload(file({ mimetype: 'application/pdf' }), 'actor-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a file over the size limit', async () => {
    const { service } = makeDeps(10);
    await expect(
      service.upload(file({ mimetype: 'image/png', size: 999 }), 'actor-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('stores a valid image, returns a /media url, and audits the write', async () => {
    const { service, prisma, audit } = makeDeps();
    const result = await service.upload(file({ mimetype: 'image/png' }), 'actor-1', 'logo');
    expect(result.url).toMatch(/^\/media\/.+\.png$/);
    expect(result.alt).toBe('logo');
    expect(prisma.mediaAsset.create).toHaveBeenCalledTimes(1);
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CREATE', entity: 'MediaAsset', actorId: 'actor-1' }),
    );
  });
});
